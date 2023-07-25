import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SockerProvider, useSocket } from "../context/SockerProvider";
import ReactPlayer from "react-player";
import PeerService from "../service/peer"; // Import the peer service instance
import { useNavigate } from "react-router-dom";

const Room = () => {
  const [myId, setMyId] = useState("");
  const [allUsers , setAllUsers ] = useState([]);
  const socket = useSocket();

  //will store all the peer connection storing it in useRef so that values get's persisted when re-render
  const peers = useRef([]);
  const navigate = useNavigate();
  
  const handleGetUsers = useCallback(({users, id})=>{
    console.log("in function")
    setAllUsers(users);
    setMyId(id);
  } , [socket]);
   
   
  useEffect(() => {
    if(socket){
      socket.on("get:users" , handleGetUsers);
       window.addEventListener("beforeunload", handledisconnect);
    }
    return ()=>{
      socket.off("get:users" , handleGetUsers);
      window.removeEventListener("beforeunload", handledisconnect);
    }
  }, [socket , handleGetUsers]);

  useEffect(() => {
    if(allUsers.length > 0){
      allUsers.forEach(element => {
        
      });
    }
  
    return () => {
      
    }
  }, [])
  





 //for disconnection of socket , when we close the tab / or click end user
  const handledisconnect= ()=>{
    if(socket){
      socket.emit("disconnect:me");
    }
    navigate('/');
  }

  return <div>
    <h1>Room</h1>
    <button onClick={handledisconnect}>end user</button>
  </div>;
};

export default Room;
