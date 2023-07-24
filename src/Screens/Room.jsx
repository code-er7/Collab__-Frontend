import React, { useCallback, useEffect, useRef, useState } from "react";
import { SockerProvider, useSocket } from "../context/SockerProvider";
import ReactPlayer from "react-player";
import PeerService from "../service/peer"; // Import the peer service instance

const Room = () => {
  const [myEmail, setMyEmail] = useState("");
  const socket = useSocket();

  const handleUserJoined = useCallback(
    ({ email, id, users }) => {
      console.log("Received user:joined event:", email, id, users);
    },
    [socket]
  );

  const handleMyCredentials = useCallback(
    (data) => {
      const { email } = data;
      console.log("handleMyCredentials: Setting email to", email);
      setMyEmail(email);
    },
    [socket]
  );

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    if (socket.connected) {
      socket.on("mycredentials", handleMyCredentials);
      console.log("Subscribed to mycredentials event");
    }

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("mycredentials", handleMyCredentials);
    };
  }, [socket, handleUserJoined, handleMyCredentials]);

  useEffect(() => {
    console.log("myEmail has been updated:", myEmail);
  }, [myEmail]);

  return <div>Room</div>;
};

export default Room;
