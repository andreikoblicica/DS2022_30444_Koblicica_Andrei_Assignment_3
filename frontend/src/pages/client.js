import React, {useState, useEffect, useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid';
import devices from "../services/devices";
import users from "../services/users";
import auth from "../services/auth";
import {Chart as ChartJS} from "chart.js/auto";
import SockJsClient from 'react-stomp';
import {ChatBox} from 'react-chatbox-component';
import Chat from "../components/chat.js"
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'
import { Store } from 'react-notifications-component';


import {Bar} from 'react-chartjs-2';
import {
    AppBar,
    Box,
    Button,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel, MenuItem, Select, TextField,
    Toolbar,
    Typography
} from "@mui/material";
import authHeader, {BASE_URL, HTTP} from "../services/http";




function Client(){


    const user = useLocation().state;
    const [allDevices, setAllDevices]=useState([]);
    const [date, setDate]=useState(new Date());
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedDevice, setSelectedDevice]=useState([]);
    const [consumptionValues, setConsumptionValues]=useState([]);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage]=useState("")
    const [deviceId, setDeviceId]=useState(0);
    const [clientRef, setClientRef]=useState();
    const [canType, setCanType]=useState(true);
    const [isTyping, setIsTyping]=useState(false);
    const [canSendNotification, setCanSendNotification]=useState(true)
    const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);


    const nodeRef = useRef();
    const isVisible = useIsVisible(nodeRef)



    const chartData ={
        labels: consumptionValues.map((data)=>data.hour),
        datasets: [{
            title:{
                display:true,
                text:'Energy consumption',
                fontSize:20
            },
            label: "Consumption (kWh)",
            legend:{
                display:true,
                position: 'right'
            },
            backgroundColor: '#01d28e',
            borderColor: 'rgba(0,0,0,1)',
            borderWidth: 2,
            data: consumptionValues.map((data)=>data.consumption),

        }]
    }

    const navigate = useNavigate();

    useEffect(() => {
        if(!user){
            navigate("/");
        }
        async function getAllDevices(){
            const res= await devices.findByUserId(user.id);
            setAllDevices(res);
        }

        getAllDevices();



    }, [refreshKey])

    useEffect(()=>{
        if(isVisible && canSendNotification && messages.length>0 && messages.at(messages.length-1).sourceUserId===4){
            let status={
                sourceUsername: user.username,
                destinationUserId: 4,
                status: "Seen"

            }
            users.sendStatus(status)
            setCanSendNotification(false)
        }
    },[isVisible,messagesRefreshKey])

    useEffect(()=>{
        if(isTyping && canType){
            setCanType(false)
            let status={
                sourceUsername: user.username,
                destinationUserId: 4,
                status: "Typing"

            }
            users.sendStatus(status)
        }
    },[isTyping])

    useEffect(()=>{
       if(messages.length>0 && messages.at(messages.length-1).sourceUserId===4){
           setCanSendNotification(true)
           setMessagesRefreshKey(messagesRefreshKey=>messagesRefreshKey+1)
       }
    },[messages])




    const columns = [
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'description', headerName: 'Description', width: 350 },
        { field: 'address', headerName: 'Address', width: 300 },
        { field: 'maxHourlyConsumption', headerName: 'Maximum Hourly Consumption', width: 300 },
    ]

    const logOut=()=>{
        auth.logout();
        navigate("/")
    }


    const handleShowChart=()=>{
        HTTP.get(BASE_URL + "/devices/"+selectedDevice.id+"/"+date, { headers: authHeader() }).then(
            (response) => {
               setConsumptionValues(response.data);
            }
        );
    }

    const showNotification=(message)=>{
        for(let i=0;i<allDevices.length;i++){
            if(allDevices[i].id===message.deviceId){
                console.log(message)
                setMessage(message.message)
                setDeviceId(message.deviceId)
                alert(message.message+" "+message.deviceId)
            }
        }

    }

    const onConnect=()=>{
        console.log("Connected!")
    }

    const onDisconnect=()=>{
        console.log("Disconnected!")
    }

    const showNewMessage=(message)=>{
        console.log(message)
        setMessages(messages=>[...messages,message])
    }

    const sendMessage=()=>{
        let message={
            sourceUserId: user.id,
            destinationUserId: 4,
            message: newMessage

        }
        setMessages(messages=>[...messages,message])
        users.sendMessage(message)
        setNewMessage("")
         setCanType(true)
         setIsTyping(false)
    }

    const textFieldChanged=(e)=>{
        setNewMessage(e.target.value)
        if(e.target.value!=="" && canType){
            setIsTyping(true)
        }
    }

    const showMessageNotification=(status)=>{
        console.log(status)
        if(status.status==="Seen"){
           // alert(status.sourceUsername + "read your message!")
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
            //alert(status.sourceUsername + "is typing")
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





    return(
        <Container maxWidth="xl" disableGutters>
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
                    <h3>My Devices</h3>
                </div>
                <div className="table">
                    <DataGrid
                        rows={allDevices}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                    />
                </div>
            </div>

            <div>
                <SockJsClient url={'http://localhost:8089/ws'}
                              topics={['/topic/notifications']}
                              onMessage={(msg) => { showNotification(msg) }}
                              //onMessage={(msg) => { showNewMessage(msg) }}
                              onConnect={()=>onConnect()}
                              onDisconnect={()=>onDisconnect()} />
            </div>

            <div className="tables">
            <div className="table-header">
                <h3>{message} {deviceId}</h3>
            </div></div>



            <div className="tables">
                <div className="table-header">
                    <h3>View Energy Consumption</h3>
                </div>
                <div className="consumption-options">
                        <input
                            type="date"
                            placeholder="Date"
                            style={{width: 300, height: 53}}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />


                          <FormControl margin="dense"  >
                        <InputLabel id="selectDevice">Select Device</InputLabel>
                        <Select
                            labelId="selectDevice"
                            value={selectedDevice.description}
                            label="Select device"
                            style={{width:300, marginBottom: 5}}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                        >
                            {allDevices.map((device)=>
                            {return (<MenuItem key={device.id} value={device}>{device.description}</MenuItem>
                            )})}
                        </Select>
                    </FormControl>

                    <button className="charts-button" onClick={handleShowChart}>Show Chart</button>

                </div>
            </div>

            <div>
                <div className="chart">
                    <Bar
                        data={chartData}
                        options={{
                            title:{
                                display:true,
                                text:'Energy consumption',
                                fontSize:20
                            },
                            legend:{
                                display:true,
                                position: 'right'
                            }
                        }}
                    />
                </div>

            </div>

            <div className="tables">
                    <h3>Chat with admin</h3>
            </div>


            <div className="chat">

                <div ref={nodeRef}>
                    {messages.map((message)=>
                    {return (
                        <div className="msg" key={message.position}>
                            <p className="nameTag">{message.sourceUserId===user.id ? "You" : "Admin"}</p>
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
                        onChange={(e) =>textFieldChanged(e)}

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
                              onMessage={(status) => { showMessageNotification(status) }}
                              onConnect={()=>onConnect()}
                              onDisconnect={()=>onDisconnect()}
                />

            </div>



        </Container>
    );
}
export default Client;