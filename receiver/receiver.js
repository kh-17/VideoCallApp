const webSocket = new WebSocket("ws://127.0.0.1:3000");

webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

// receiver gets offers 
function handleSignallingData(data) {
    switch (data.type) {
        case "offer":
            peerConn.setRemoteDescription(data.offer) // offer is passed
            createAndSendAnswer()
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

// offer is sent
function createAndSendAnswer () {
    peerConn.createAnswer((answer) => {
        peerConn.setLocalDescription(answer)  // answer sent to server
        sendData({
            type: "send_answer",
            answer: answer
        })
    }, error => {
        console.log(error)
    })
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}


let localStream
let peerConn
let username

function joinCall() {

    // get username from input box to get the value
    username = document.getElementById("username-input").value

    document.getElementById("video-call-div")
    .style.display = "inline"

    navigator.getUserMedia({
        video: true,
        audio: true
    }, (stream) => {
        localStream = stream
        document.getElementById("local-video").srcObject = localStream

        let configuration = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302", 
                    "stun:stun1.l.google.com:19302", 
                    "stun:stun2.l.google.com:19302"]
                }
            ]
        }

        peerConn = new RTCPeerConnection(configuration)
        peerConn.addStream(localStream)

        peerConn.onaddstream = (e) => {
            document.getElementById("remote-video")
            .srcObject = e.stream
        }

        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null)
                return
            
            sendData({
                type: "send_candidate",  // send candidate to the username
                candidate: e.candidate
            })
        })

        sendData({
            type: "join_call"
        })

    }, (error) => {
        console.log(error)
    })
}

let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}