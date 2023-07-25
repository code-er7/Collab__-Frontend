import React, { useCallback, useEffect, useState } from "react";
import "../App.css";
import { useSocket } from "../context/SockerProvider";
import { useNavigate } from "react-router-dom";
const Lobby = () => {
  const [email, setEmail] = useState();
  const [room, setRoom] = useState();
  const socket = useSocket();
  const navigate = useNavigate();
  const handleSubmitForm = useCallback((e) => {
    e.preventDefault();
    socket.emit("room:join", { email, room });
  } , [email , room , socket]);
const handleRoomJoin = useCallback((data)=>{
    const {email , room } = data;
    navigate(`/room/${room}`);

} , [])

useEffect(() => {
  // socket.on("mycredentials", handleMyCredentials);
  socket.on("room:join" , handleRoomJoin)
  return ()=>{
  socket.off('room:join' , handleRoomJoin);
  }
}, [socket , handleRoomJoin])

  return (
    <div className="container">
      <h1>Lobby</h1>
      <form action="" onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email</label>
        <input
          onChange={(e) => setEmail(e.target.value)}
          type="text"
          id="email"
        />
        <br />
        <label htmlFor="room-number">Room</label>
        <input
          onChange={(e) => setRoom(e.target.value)}
          type="text"
          id="room-number"
        />
        <br />
        <button type="submit">Join</button>
      </form>
    </div>
  );
};

export default Lobby;
