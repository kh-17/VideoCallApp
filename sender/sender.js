const webSocket = new WebSocket("ws://127.0.0.1:3000");

// any message from the server is converted from string to data
webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}


function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

let username
// get username and store in server
function sendUsername() {

    username = document.getElementById("username-input").value
    sendData({
        type: "store_user"   // stores users
    })
}

// username attached for server to know who the data belongs to
function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data)) //convert data obj to string
}


let localStream
let peerConn

// for video and audio
function startCall() {
    document.getElementById("video-call-div")
    .style.display = "inline"

    // local stream from device and show it to local video obj
    navigator.getUserMedia({
        video: true,
        audio: true
    }, 
    // shows the stream in the local video element
    (stream) => {
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
        // create a peer connection
        peerConn = new RTCPeerConnection(configuration)

        // stream attached to peer connection
        peerConn.addStream(localStream)

        peerConn.onaddstream = (e) => {
            document.getElementById("remote-video")
            .srcObject = e.stream
        }

        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null)
                return

            // candidate is sent to the server
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })

        createAndSendOffer()
    }, (error) => {
        console.log(error)
    })
}
 // creat and store offer
function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error)
    })
}

// for audio and video buttons to work
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