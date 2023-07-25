import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SockerProvider, useSocket } from "../context/SockerProvider";
import ReactPlayer from "react-player";
import PeerService from "../service/peer"; // Import the peer service instance
import { useNavigate } from "react-router-dom";

const Room = () => {
  const [peers, setPeers] = useState([]);
  const socket = useSocket();

  //this is for refrencing which tells us that thisUserId belongs to this peer
  //here will be objects of userId: peers
  const peerRef = useRef([]);
  const fullyConnectedPeers = useRef([]);
  const navigate = useNavigate();

  const handleGetUsers = useCallback(
    ({ users, id }) => {
      console.log(users);
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

    //storing the new Peer in peerRef wrt to it's sender id
    peerRef.current.push({ userId: senderId, newPeer });
    fullyConnectedPeers.current.push(newPeer);

    setTimeout(() => {
      socket.emit("sending:ans", { ans, senderId });
    }, 100);
  };
  const handleRecievingAns = async ({ senderId, ans }) => {
    console.log("Received ans from senderId:", senderId);
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
        console.log("Found PeerService instance for senderId:", senderId);
        const newPeer = validPeers[0]; // Take the first valid peer

        // Check if the newPeer object has the setDescription method
        if (typeof newPeer.setDescription === "function") {
          console.log("newPeer has setDescription method.");

          // Set ans as remote description for that peer
          await newPeer.setDescription(ans);
          console.log(newPeer);
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
      <button onClick={handledisconnect}>end user</button>
    </div>
  );
};

export default Room;
