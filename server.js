const Socket = require("websocket").server
const http = require("http")

// server created 
const server = http.createServer((req, res) => {})

// server starts to run 
server.listen(3000, () => {
    console.log("Listening on port 3000...")
})

const webSocket = new Socket({ httpServer: server })

// array created to hold data of senders
let users = []


webSocket.on('request', (req) => {
    const connection = req.accept()  // variable to hold connection for the request

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)

        const user = findUser(data.username)

        switch(data.type) {
            case "store_user":   // store this person in the users array

                if (user != null) {
                    return
                }
                
                // two things are stored: connection and username
                const newUser = {
                     conn: connection,
                     username: data.username
                }

                users.push(newUser)
                console.log(newUser.username)
                break

            case "store_offer":
                if (user == null)
                    return
                user.offer = data.offer // atach offer to user
                break
            
            case "store_candidate":  // to store candidate for this user
                if (user == null) {
                    return
                }
                if (user.candidates == null)
                    user.candidates = []
                
                user.candidates.push(data.candidate)
                break
             // received from the receiver
            case "send_answer":  
                if (user == null) {
                    return
                }
                // answer and connection sent 
                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break
                // send the candidate
            case "send_candidate": 
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break
                
                // return the offer and candidate to the user variable
            case "join_call":
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)
                
                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                })

                break
        }
    })

    // reomve users from the array once the connection is closed
    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})

function sendData(data, conn) {
    conn.send(JSON.stringify(data))
}

// to see if the user to be pushed in the array already exists in it or not
function findUser(username) {
    for (let i = 0;i < users.length;i++) {
        if (users[i].username == username)
            return users[i]
    }
}