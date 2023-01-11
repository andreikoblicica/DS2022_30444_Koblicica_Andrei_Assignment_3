import authHeader, { BASE_URL, HTTP } from "./http";

export default {
    findAll() {
        return HTTP.get(BASE_URL + "/admin/users",{ headers: authHeader() } ).then(
            (response) => {
                return response.data;
            }
        );
    },
    create(user) {
        return HTTP.post(BASE_URL + "/auth/sign-up", user, { headers: authHeader() }).then(
            (response) => {
                return response.data;
            }
        );
    },
    update(user) {
        return HTTP.put(BASE_URL + "/admin/users" , user, {
            headers: authHeader(),
        }).then((response) => {
            return response.data;
        });
    },
    delete(id) {
        return HTTP.delete(BASE_URL + "/admin/users/"+ id, {
            headers: authHeader(),
        }).then((response) => {
            return response.data;
        });
    },

    sendMessage(message){
        return HTTP.post(BASE_URL+"/send", message,{ headers: authHeader() }).then(
            (response) => {
                return response.data;
            }
        );
    },

    sendStatus(status){
        return HTTP.post(BASE_URL+"/status", status,{ headers: authHeader() }).then(
            (response) => {
                return response.data;
            }
        );
    }


};