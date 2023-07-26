import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SockerProvider, useSocket } from "../context/SockerProvider";
import PeerService from "../service/peer"; // Import the peer service instance
import { useNavigate } from "react-router-dom";

const Room = () => {
  const [peers, setPeers] = useState([]);
  const socket = useSocket();
  const LocalMediaStreamRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  //this is for refrencing which tells us that thisUserId belongs to this peer
  //here will be objects of userId: peers
  const peerRef = useRef([]);
  const fullyConnectedPeers = useRef([]);
  const checker = useRef(0);
  const navigate = useNavigate();
  const [localMedia, setLocalMedia] = useState(null);

  //sending and reciving media functions
  const mediaConstraints = {
    video: {
      width: { max: 320 },
      height: { max: 240 },
      // aspectRatio: 1,
      frameRate: { ideal: 10, max: 15 },
    },
    audio: true,
  };
  const handleTransmitMedia = () => {
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((mediaStream) => {
        // Set the media stream in state, so you can display it on your UI if needed
        LocalMediaStreamRef.current = mediaStream;
      });
  };
  const handleShareMedia = () => {
    if (fullyConnectedPeers.current.length >= 1) {
      fullyConnectedPeers.current.forEach((newPeer) => {
        if (newPeer != null) {
          newPeer.transmitLocalMediaToPeers(); // Call transmitLocalMediaToPeers on newPeer
        }
      });
      console.log("transmitting media ");
      setLocalMedia(LocalMediaStreamRef.current);
    }
  };

  const handleSendStreams = () => {
    handleShareMedia();
  };
const handleGetStreams = () => {
  fullyConnectedPeers.current.forEach((peer) => {
    console.log("gothcha");
    peer.peer.ontrack = (event) => {
      const newStream = event.streams[0];
      console.log("//////");
      console.log(newStream);
      console.log("//////");
      setRemoteStreams((prevStreams) => ({
        ...prevStreams,
        [peer.userId]: newStream,
      }));
    };
  });
};
  //event functions

  const handleGetUsers = useCallback(
    ({ users, id }) => {
      console.log(users);
      handleTransmitMedia();
      //when user get's all the user at the same time make all the peers to which he needs to be connected
      if (users) {
        const npeers = [];
        users.forEach((targetUserId) => {
          const newPeer = createPeer(targetUserId);
          npeers.push(newPeer);
          peerRef.current.push({ userId: targetUserId, newPeer });
        });
        setPeers(npeers);
      }
    },
    [socket]
  );
  const handleOfferRecived = async ({ senderId, offer }) => {
    //creating new Peer for the offer
    const newPeer = new PeerService();
    //creating a ans for the offer
    const ans = await newPeer.getAnswer(offer);
    newPeer.mediaStream = LocalMediaStreamRef.current;

    //storing the new Peer in peerRef wrt to it's sender id
    peerRef.current.push({ userId: senderId, newPeer });
    fullyConnectedPeers.current.push(newPeer);

    setTimeout(() => {
      socket.emit("sending:ans", { ans, senderId });
    }, 100);
  };
  const handleRecievingAns = async ({ senderId, ans }) => {
    const AnsForId = senderId;
    try {
      // Get an array of Promises of foundPeer objects
      const foundPeerPromises = peerRef.current.map((obj) => {
        if (obj.userId === AnsForId) {
          return obj.newPeer; // Return the Promise
        }
        return null; // Return null for other elements in the array
      });

      // Wait for all the Promises to resolve
      const resolvedPeers = await Promise.all(foundPeerPromises);

      // Filter out null values (not found) from the resolvedPeers
      const validPeers = resolvedPeers.filter((peer) => peer !== null);

      if (validPeers.length > 0) {
        // Access the resolved PeerService instance
        const newPeer = validPeers[0]; // Take the first valid peer

        // Check if the newPeer object has the setDescription method
        if (typeof newPeer.setDescription === "function") {
          // Set ans as remote description for that peer
          await newPeer.setDescription(ans);
          console.log("Got the answer for UserId: ", senderId);
          console.log("This is the Peer which is full connected ", newPeer);
          fullyConnectedPeers.current.push(newPeer);
        } else {
          console.log("newPeer does not have setDescription method.");
        }
      } else {
        console.log("Peer not found for the given senderId.");
      }
    } catch (error) {
      console.error("Error handling receiving answer:", error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("get:users", handleGetUsers);
      window.addEventListener("beforeunload", handledisconnect);
    }
    socket.on("recieve:offer", handleOfferRecived);
    socket.on("recieving:ans", handleRecievingAns);

    return () => {
      socket.off("get:users", handleGetUsers);
      socket.off("recieve:offer", handleOfferRecived);
      window.removeEventListener("beforeunload", handledisconnect);
    };
  }, [socket, handleGetUsers]);

  const createPeer = async (targetUserId) => {
    const newPeer = new PeerService();
    // Step 1: Create an offer
    const offer = await newPeer.getOffer();
    //emit the offer to the intendend user
    socket.emit("sendOffer", { targetUserId, offer });
    newPeer.mediaStream = LocalMediaStreamRef.current;
    return newPeer;
  };

  //for disconnection of socket , when we close the tab / or click end user
  const handledisconnect = () => {
    if (socket) {
      socket.emit("disconnect:me");
    }
    navigate("/");
  };

  return (
    <div>
      <h1>Room</h1>
      {localMedia && (
        <video
          autoPlay
          muted
          ref={(video) => {
            video.srcObject = localMedia;
          }}
        />
      )}
      {Object.keys(remoteStreams).map((userId) => (
        <video
          key={userId}
          autoPlay
          ref={(video) => {
            if (video) {
              video.srcObject = remoteStreams[userId];
            }
          }}
        />
      ))}
      <button onClick={handledisconnect}>End User</button>
      <button onClick={handleSendStreams}>send Streams</button>
      <button onClick={handleGetStreams}>Get Streams</button>
    </div>
  );
};

export default Room;
