import React, {useState, useEffect, useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid';
import devices from "../services/devices";
import auth from "../services/auth";
import {
    AppBar,
    Box,
    Button,
    Container, Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel, MenuItem, Select,
    Toolbar,
    Typography
} from "@mui/material";
import users from "../services/users";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import Chat from "../components/chat";
import SockJsClient from "react-stomp";
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'
import { Store } from 'react-notifications-component';

function Admin(){

    const user = useLocation().state;
    const [allUsers, setAllUsers]=useState([]);
    const [allDevices, setAllDevices]=useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [userDialogTitle, setUserDialogTitle]=useState("");
    const [openUserDialog, setOpenUserDialog]=useState(false);
    const [deviceDialogTitle, setDeviceDialogTitle]=useState("");
    const [openDeviceDialog, setOpenDeviceDialog]=useState(false);
    const [formUsername, setFormUsername]=useState("");
    const [formPassword, setFormPassword]=useState("");
    const [selectedUser, setSelectedUser]=useState([]);
    const [selectedDevice, setSelectedDevice]=useState([]);
    const [formDescription, setFormDescription]=useState("");
    const [formAddress, setFormAddress]=useState("");
    const [formMaxHourlyConsumption, setFormMaxHourlyConsumption]=useState("");
    const [mappedUser, setMappedUser]=useState("");
    const [newMessage, setNewMessage]=useState("");
    const [messages, setMessages]=useState([]);
    const [selectedUserMessages, setSelectedUserMessages]=useState([]);
    const [selectedChatUser, setSelectedChatUser]=useState([]);
    const navigate = useNavigate();
    const [canSendNotification, setCanSendNotification]=useState(true)
    const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);
    const [canType, setCanType]=useState(true);
    const [isTyping, setIsTyping]=useState(false);

    const nodeRef = useRef();
    const isVisible = useIsVisible(nodeRef)

    useEffect(() => {
        if(!user){
            navigate("/");
        }
        async function getAllUsers(){
            const res= await users.findAll();
            setAllUsers(res);
        }
        async function getAllDevices(){
            const res= await devices.findAll();
            setAllDevices(res);
        }
        getAllUsers();
        getAllDevices();
    }, [refreshKey])

    useEffect(() => {
        setSelectedUserMessages(messages.filter((message)=>message.sourceUserId===selectedChatUser.id || message.destinationUserId===selectedChatUser.id))
        console.log(selectedChatUser)
    }, [selectedChatUser,messages])

    useEffect(()=>{
        if(selectedUserMessages.length>0 && selectedUserMessages.at(selectedUserMessages.length-1).sourceUserId===selectedChatUser.id){
            setCanSendNotification(true)
            setMessagesRefreshKey(messagesRefreshKey=>messagesRefreshKey+1)
        }
    },[selectedUserMessages])

    useEffect(()=>{

        if(selectedChatUser.id){
            if(isVisible && canSendNotification && selectedUserMessages.length>0  && selectedUserMessages.at(selectedUserMessages.length-1).sourceUserId===selectedChatUser.id ){
                let status={
                    sourceUsername: user.username,
                    destinationUserId: selectedChatUser.id,
                    status: "Seen"

                }
                users.sendStatus(status)
                setCanSendNotification(false)
            }
        }

    },[isVisible,messagesRefreshKey])

    useEffect(()=>{
        if(isTyping && canType){
            setCanType(false)
            let status={
                sourceUsername: user.username,
                destinationUserId: selectedChatUser.id,
                status: "Typing"

            }
            users.sendStatus(status)
        }
    },[isTyping])

    const userColumns = [
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'username', headerName: 'Username', width: 350 },
        { field: 'role', headerName: 'Role', width: 200 },
    ]

    const deviceColumns = [
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'description', headerName: 'Description', width: 250 },
        { field: 'address', headerName: 'Address', width: 250 },
        { field: 'maxHourlyConsumption', headerName: 'Maximum Hourly Consumption', width:  250},
        {field: 'username', headerName: 'Assigned User', width: 250}
    ]

    const logOut=()=>{
        auth.logout();
        navigate("/")
    }

    const handleAddUser=()=>{
        setUserDialogTitle("Add User");
        setOpenUserDialog(true);
    }

    const handleUpdateUser=()=>{
        setUserDialogTitle("Update User");
        setFormUsername(selectedUser.username);
        setFormPassword("");
        setOpenUserDialog(true);
    }

    const handleSubmitUser=()=>{
        if(validUserForm()){
            if(userDialogTitle==="Add User"){
                addUser();
            }else{
                updateUser();

            }
            cancel();
            setOpenUserDialog(false);
        }
        else{
            alert("Make sure you insert correct values!")
        }

    }

    const addUser=()=>{
        let signUpRequest={
            username: formUsername,
            password: formPassword,
        };

        auth.register(signUpRequest).then((response)=>{
            alert(response.data.message);
            setRefreshKey(refreshKey + 1)
        })
            .catch(()=>alert("Error creating user"));
    }


    const updateUser=()=>{
        let user={
            id: selectedUser.id,
            username: formUsername,
            password: formPassword
        }
        users.update(user).then(()=>{
            setRefreshKey(refreshKey + 1)
        }) .catch(()=>alert("Error updating user"));
    }

    const deleteUser=()=>{
        const id=selectedUser.id;
        users.delete(id).then(()=> setRefreshKey(refreshKey + 1));
    }

    const cancel=()=>{
        setFormUsername("");
        setFormPassword("");
        setFormDescription("");
        setFormMaxHourlyConsumption("");
        setFormAddress("");
        setMappedUser("");
        setOpenUserDialog(false);
        setOpenDeviceDialog(false);
    }

    const handleAddDevice=()=>{
         setDeviceDialogTitle("Add Device");
         setOpenDeviceDialog(true);
    }

    const handleUpdateDevice=()=>{
        setDeviceDialogTitle("Update Device");
        setFormDescription(selectedDevice.description);
        setFormAddress(selectedDevice.address);
        setFormMaxHourlyConsumption(selectedDevice.maxHourlyConsumption);
        setMappedUser(selectedDevice.username);
        setOpenDeviceDialog(true);
    }

    const handleDeleteDevice=()=>{
        const id=selectedDevice.id;
        devices.delete(id).then(()=> setRefreshKey(refreshKey + 1));
    }

    const validUserForm=()=>{
        if(formUsername==="" || (userDialogTitle==="Add User"&&formPassword==="")){
            return false;
        }
        return true;
    }

    const validDeviceForm=()=>{
        let n = formMaxHourlyConsumption
        if(formDescription==="" || formAddress==="" || formMaxHourlyConsumption==="" || mappedUser==="" ){
            return false;
        }
        return true;
    }

    const handleSubmitDevice=()=>{
        let device={
            id: null,
            description: formDescription,
            address: formAddress,
            maxHourlyConsumption: formMaxHourlyConsumption,
            username: mappedUser,
        };

        if(validDeviceForm()){
            if(deviceDialogTitle==="Add Device"){
                addDevice(device);
            }else{
                updateDevice(device);
            }
            cancel();
            setOpenDeviceDialog(false);
        }
        else{
            alert("Make sure you insert correct values!")
        }
    }

    const addDevice=(device)=>{
        devices.create(device).then((response)=>{
            setRefreshKey(refreshKey + 1)
        })
            .catch(()=>alert("Error creating device"));
    }

    const updateDevice=(device)=>{
        device.id=selectedDevice.id;
        devices.update(device).then(()=>{
            setRefreshKey(refreshKey + 1)
        }) .catch(()=>alert("Error updating device"));
    }


    ///chat
    const onConnect=()=>{
        console.log("Connected!")
    }

    const onDisconnect=()=>{
        console.log("Disconnected!")
    }

    const showNewMessage=(message)=>{
        console.log(messages)
        setMessages(messages=> [...messages,message])
    }

    const sendMessage=()=>{
        if(selectedChatUser.id){

            let message={
                sourceUserId: user.id,
                destinationUserId: selectedChatUser.id,
                message: newMessage

            }
            users.sendMessage(message)
            setMessages(messages=>[...messages,message])
            setSelectedUserMessages(selectedUserMessages=> [...selectedUserMessages,message])
            setNewMessage("")
            setCanType(true)
            setIsTyping(false)
        }
        else{
            alert("Please select a user first")
        }
    }

    const showNotification=(status)=>{
        console.log(status)
        if(status.status==="Seen"){
            //alert(status.sourceUsername + "read your message!")
            Store.addNotification({
                title: "Chat info",
                message: status.sourceUsername + " has read your message!",
                type: "info",
                insert: "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {
                    duration: 2500,
                    onScreen: true
                }

            });
        }else if(status.status==="Typing"){
           // alert(status.sourceUsername + " is typing!")
            Store.addNotification({
                title: "Chat info",
                message: status.sourceUsername + " is typing!",
                type: "info",
                insert: "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {
                    duration: 2500,
                    onScreen: true
                }
            });
        }
    }

    const textFieldChanged=(e)=>{
        setNewMessage(e.target.value)
        if(e.target.value!=="" && canType){
            setIsTyping(true)
        }
    }


    return(
        <Container disableGutters maxWidth="xl">
            <Box sx={{ flexGrow: 1 }}>
                <AppBar style={{ background: '#01d28e' }} position="static">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                           <h3> Energy Platform</h3>
                        </Typography>
                        <Button color="inherit"  onClick={logOut}>Logout</Button>
                    </Toolbar>
                </AppBar>
            </Box>

            <div className="tables">
                <div className="table-header">
                    <span><h3>Users</h3></span>
                    <span className="row-container">
                            <button type="submit" onClick={handleAddUser}>Add User</button>
                            <button type="submit" onClick={deleteUser}>Delete User</button>
                            <button type="submit" onClick={handleUpdateUser}>Update User</button>
                    </span>
                </div>
                <div>
                    <div className="table">
                        <DataGrid
                            rows={allUsers}
                            columns={userColumns}
                            pageSize={10}
                            rowsPerPageOptions={[10]}
                            onRowClick={(rowInfo) =>
                            { setSelectedUser(rowInfo.row)}}
                        />
                    </div>
                </div>

                <div className="table-header">
                    <span><h3>Devices</h3></span>
                    <span className="row-container">
                            <button type="submit"  onClick={handleAddDevice}>Add Device</button>
                            <button type="submit" onClick={handleUpdateDevice}>Update Device</button>
                            <button type="submit" onClick={handleDeleteDevice}>Delete Device</button>
                        </span>
                </div>

                <div >
                    <div className="table">
                        <DataGrid
                            rows={allDevices}
                            columns={deviceColumns}
                            pageSize={10}
                            rowsPerPageOptions={[10]}
                            onRowClick={(rowInfo) =>
                            { setSelectedDevice(rowInfo.row)}}
                        />
                    </div>
                </div>
            </div>

            <Dialog open={openUserDialog} >
                <DialogTitle>{userDialogTitle}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="username"
                        label="Username"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancel}>Cancel</Button>
                    <Button onClick={handleSubmitUser}>Submit</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeviceDialog} >
                <DialogTitle>{deviceDialogTitle}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="description"
                        label="Description"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="address"
                        label="Address"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="maxHourlyConsumption"
                        label="Maximum Hourly Consumption"
                        type="text"
                        variant="standard"
                        fullWidth
                        value={formMaxHourlyConsumption}
                        onChange={(e) => setFormMaxHourlyConsumption(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense" >
                        <InputLabel id="selectUser">mappedUser</InputLabel>
                        <Select
                            labelId="selectUser"
                            value={mappedUser}
                            label="Mapped User"
                            onChange={(e) => setMappedUser(e.target.value)}
                        >
                            {allUsers.map((user)=>
                            {return (<MenuItem key={user.id} value={user.username}>{user.username}</MenuItem>
                            )})}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancel}>Cancel</Button>
                    <Button onClick={handleSubmitDevice}>Submit</Button>
                </DialogActions>
            </Dialog>


            <div className="tables">
                <h3>Chat with clients</h3>

                <FormControl margin="dense"  >
                    <InputLabel id="selectUser">Select User</InputLabel>
                    <Select
                        labelId="selectUser"
                        value={selectedChatUser}
                        label="Select User"
                        style={{width:300,height:40, marginBottom: 20}}
                        onChange={(e) => {
                            setSelectedChatUser(e.target.value);

                        }}
                    >
                        {allUsers.map((user)=>
                        {return (<MenuItem key={user.id} value={user}>{user.username}</MenuItem>
                        )})}
                    </Select>
                </FormControl>
            </div>

            <div className="chat">

                <div  ref={nodeRef}>
                    {
                        selectedUserMessages.map((message)=>
                    {return (
                        <div className="msg" key={message.position}>
                            <p className="nameTag">{message.sourceUserId===user.id ? "You" : selectedChatUser.username}</p>
                            <p className={message.sourceUserId===user.id ? "your-message" : "message"}>{message.message}</p>
                        </div>
                    )})}
                </div>

                <div className="chat-options">
                    <TextField
                        autoFocus
                        margin="dense"
                        id="outlined-basic"
                        label="Type your message here"
                        fullWidth
                        type="text"
                        variant="standard"
                        value={newMessage}
                        onChange={(e) => textFieldChanged(e)}
                    />
                    <button type="submit" onClick={sendMessage}>Send</button>
                </div>

            </div>


            <div>
                <SockJsClient url={'http://localhost:8089/ws'}
                              topics={['/topic/messages/'+user.id]}
                              onMessage={(msg) => { showNewMessage(msg) }}
                              onConnect={()=>onConnect()}
                              onDisconnect={()=>onDisconnect()}
                />

            </div>

            <div>
                <SockJsClient url={'http://localhost:8089/ws'}
                              topics={['/topic/status/'+user.id]}
                              onMessage={(status) => { showNotification(status) }}
                              onConnect={()=>onConnect()}
                              onDisconnect={()=>onDisconnect()}
                />

            </div>


        </Container>
    );
}
export default Admin;