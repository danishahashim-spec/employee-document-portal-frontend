import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("password123");
  const [errMsg, setErrMsg] = useState("");

  async function onLogin(e) {
    e.preventDefault();
    setErrMsg("");
try {
   const res = await api("/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",   
  },
  body: JSON.stringify({ email, password }),
});

  const token = res?.token;
  const role  = res?.role;
  const userId = res?.id;   

  if (!token) throw new Error("No token returned");

  localStorage.setItem("token", token);
  localStorage.setItem("email", email);
  localStorage.setItem("role", role);
  localStorage.setItem("userId", res.id); 

  nav("/documents");

} catch (e2) {
  setErrMsg(e2.message || "Login failed");
}
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <h1>Employee Document Portal</h1>

      {errMsg ? <div style={{ color: "tomato" }}>{errMsg}</div> : null}

      <form onSubmit={onLogin} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            type="password"
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}