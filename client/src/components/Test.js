import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
const socket = io("http://localhost", {
    extraHeaders: {
        Authorization: "Bearer authorization_token_here",
    },
});

let timeoff;
const Test = () => {
    const [tik, setTik] = useState(new Date().getTime().toFixed(2));
    const [tok, setTok] = useState(new Date().getTime().toFixed(2));
    const [isJoined, setIsJoined] = useState(false);
    const [userList, setUserList] = useState([]);
    const [targetUser, setTargetUser] = useState(null);
    const [name, setName] = useState("");
    const [logs, setLogs] = useState([]);

    const joinRoom = () => {
        if (name.trim() === "") {
            alert("please enter name first");
            return;
        }
        socket.emit("join_room", "test", name);
    };

    const ping = (user) => {
        setTargetUser(user);
        setTik(new Date().getTime().toFixed(2));
        const message = { ping: true, date: new Date().getTime() };
        socket.emit("send_message", user.id, message);
    };

    useEffect(() => {
        socket.on("receive_message", ({ sender, message }) => {
            console.log("receive", sender, message);

            if (message.ping) {
                const message = { ping: false, date: new Date().getTime() };
                socket.emit("send_message", sender.id, { ...message, ping: false });
            } else {
                setTok(new Date().getTime().toFixed(2));
            }
        });

        socket.on("join_accepted", (isJoined) => {
            setIsJoined(isJoined);
            clearTimeout(timeoff);
            timeoff = setTimeout(() => {
                socket.emit("daemon");
            }, 1000 * 60);
        });
        socket.on("update_room", (users) => {
            setUserList(users);
        });
        socket.on("logoff", (reason) => {
            setIsJoined(false);
            setTargetUser(null);
            setUserList([]);
            setName("");
            setTik(new Date().getTime().toFixed(2));
            setTok(new Date().getTime().toFixed(2));
        });
        return () => clearTimeout(timeoff);
    }, [socket]);

    useEffect(() => {
        setLogs((prev) => {
            return [{ ...targetUser, tik, tok, latency: tok - tik }, ...prev];
        });
    }, [tok]);

    const handleJoin = () => {
        joinRoom();
    };
    return (
        <>
            <div className="table__container">
                {isJoined ? (
                    <div className="table__container">
                        <h2>Users</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>user id</th>
                                    <th>user name</th>
                                    <th>ip</th>
                                    <th>action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userList.map((user) => {
                                    return (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.ip}</td>
                                            <td>
                                                <button onClick={() => ping(user)}>ping</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <h2>Logs</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>user id</th>
                                    <th>name</th>
                                    <th>ip</th>
                                    <th>tik</th>
                                    <th>tok</th>
                                    <th>latency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    return (
                                        <tr key={log.tik + log.tok}>
                                            <td>{log.id}</td>
                                            <td>{log.name}</td>
                                            <td>{log.ip}</td>
                                            <td>{log.tik}</td>
                                            <td>{log.tok}</td>
                                            <td>{log.latency}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <label>
                        please enter name: <input value={name} onChange={(e) => setName(e.target.value)} />
                        <button onClick={handleJoin}>join</button>
                    </label>
                )}
            </div>
        </>
    );
};

export default Test;
