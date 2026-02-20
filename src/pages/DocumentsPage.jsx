import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const API_BASE = "http://127.0.0.1:8000/api/v1";


export default function DocumentsPage() {

   const nav = useNavigate();

       const role = localStorage.getItem("role");
const userId = Number(localStorage.getItem("userId"));

console.log("ROLE(frontend) =", role);
console.log("localStorage role =", localStorage.getItem("role"));
console.log("localStorage userId =", localStorage.getItem("userId"));

      const [email, setEmail] = useState("admin@test.com");
      const [password, setPassword] = useState("");
      const [token, setToken] = useState(localStorage.getItem("token") || "");
const canUpload = role === "admin" || role === "manager";
    const isEmployee = email === "user@test.com";
      const [me, setMe] = useState(null);
    
      // master data
      const [categories, setCategories] = useState([]);
      const [departments, setDepartments] = useState([]);
    
      // docs
      const [docs, setDocs] = useState([]);
      const [loading, setLoading] = useState(false);
      const [errMsg, setErrMsg] = useState("");
      // upload form
    const [uTitle, setUTitle] = useState("");
    const [uDesc, setUDesc] = useState("");
    const [uCategoryId, setUCategoryId] = useState("");
    const [uDepartmentId, setUDepartmentId] = useState("");
    const [uAccess, setUAccess] = useState("public");
    const [uFile, setUFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
      // filters (draft)
      const [q, setQ] = useState("");
      const [categoryId, setCategoryId] = useState("");
      const [departmentId, setDepartmentId] = useState("");
      const [access, setAccess] = useState("");
    
      // filters (applied)
      const [applied, setApplied] = useState({
        q: "",
        categoryId: "",
        departmentId: "",
        access: "",
      });
    
      const authHeaders = useMemo(() => {
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
      }, [token]);
    
      async function onUpload(e) {
      e.preventDefault();
      setErrMsg("");
    
      if (!token) return setErrMsg("Please login first.");
      if (!uTitle || !uCategoryId ||  !uDepartmentId || !uAccess || !uFile) {
        return setErrMsg("Please fill title, category, department, access & choose a file.");
      }
    
      try {
        setUploading(true);
    
        const form = new FormData();
        form.append("title", uTitle);
        form.append("description", uDesc);
        form.append("category_id", uCategoryId);
        form.append("department_id", uDepartmentId);
        form.append("access_level", uAccess);
        form.append("file", uFile);
    
        const res = await fetch(`${API_BASE}/documents`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            
            Accept: "application/json",
          },
          body: form,
        });
    
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Upload failed (${res.status})`);
        }
    
        // reset form
        setUTitle("");
        setUDesc("");
        setUCategoryId("");
        setUDepartmentId("");
        setUAccess("public");
        setUFile(null);
    
        // refresh table
        fetchDocs(applied);
      } catch (e) {
        setErrMsg(e.message);
      } finally {
        setUploading(false);
      }
    }
   
      async function fetchMe() {
        if (!token) return;
        try {
          const data = await api("/user", {
            method: "GET",
            headers: { ...authHeaders },
          });
          setMe(data.user);
        } catch (e) {
          // token invalid -> logout
          setMe(null);
          setToken("");
          localStorage.removeItem("token");
        }
      }
    
      async function fetchMaster() {
        try {
        const [cats, depts] = await Promise.all([
      api("/categories", { method: "GET" }),
      api("/departments", { method: "GET" }),
    ]);
    
    const catList  = cats?.data ?? cats;
    const deptList = depts?.data ?? depts;
    
    setCategories(Array.isArray(catList) ? catList : []);
    setDepartments(Array.isArray(deptList) ? deptList : []);
        } catch (e) {
        
          console.log("master data error:", e.message);
        }
      }
    
      function buildDocsQuery(params) {
        const sp = new URLSearchParams();
        if (params.q) sp.set("q", params.q);
        if (params.categoryId) sp.set("category_id", params.categoryId);
        if (params.departmentId) sp.set("department_id", params.departmentId);
        if (params.access) sp.set("access_level", params.access);
        const qs = sp.toString();
        return qs ? `?${qs}` : "";
      }
    
      async function fetchDocs(params = applied) {
        setLoading(true);
        setErrMsg("");
        try {
          const qs = buildDocsQuery(params);
          const data = await api(`/documents${qs}`, {
            method: "GET",
            headers: { ...authHeaders },
          });
          setDocs(data?.data ?? []);
        } catch (e) {
          setDocs([]);
          setErrMsg(e.message);
        } finally {
          setLoading(false);
        }
      }
    
      async function onLogin() {
        setErrMsg("");
        try {
          const data = await api("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
    
          const t = data?.token ||  data?.access_token || "";
          if (!t) throw new Error("Token tak jumpa dalam response login");
    
          setToken(t);
          localStorage.setItem("token", t);
          setPassword("");
        } catch (e) {
          setErrMsg(e.message);
        }
      }
      async function onLogout() {
        setErrMsg("");
        try {
          if (token) {
            await api("/logout", {
              method: "POST",
              headers: { ...authHeaders },
            });
          }
        } catch (e) {
        
        } finally {
          setMe(null);
          setToken("");
          localStorage.removeItem("token");
           localStorage.removeItem("email");
            localStorage.removeItem("role");
            nav("/");
        }
      }
       async function onDelete(id) {
  if (!window.confirm("Delete this document?")) return;

  try {
    await api(`/documents/${id}`, {
      method: "DELETE",
    });

    fetchDocs(applied); 
    alert("Deleted!");
  } catch (e) {
    alert(e.message || "Delete failed");
  }
}
 
    
      async function onDownload(doc) {
        setErrMsg("");
        try {
          const res = await fetch(
            `${API_BASE}/documents/${doc.id}/download`,
            {
              method: "GET",
              headers: { ...authHeaders },
            }
          );
    
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || `Download failed (${res.status})`);
          }
    
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
    
          const a = document.createElement("a");
          a.href = url;
          a.download = doc.file_name || "document";
          document.body.appendChild(a);
          a.click();
          a.remove();
    
          window.URL.revokeObjectURL(url);
        } catch (e) {
          setErrMsg(e.message);
        }
      }
    
      function onApply() {
        const next = { q, categoryId, departmentId, access };
        setApplied(next);
      }
    
      function onClear() {
        setQ("");
        setCategoryId("");
        setDepartmentId("");
        setAccess("");
        setApplied({ q: "", categoryId: "", departmentId: "", access: "" });
      }
    
    
      useEffect(() => {
      api("/ping")
        .then((d) => console.log("PING OK:", d))
        .catch((e) => console.log("PING ERROR:", e.message));
    }, []);
    
      useEffect(() => {
        fetchMaster();
      }, []);
    
    
      useEffect(() => {
        fetchMe();
       
      }, [token]);
    

      useEffect(() => {
        if (!token) {
          setDocs([]);
          return;
        }
        fetchDocs(applied);

      }, [applied, token]);
    
      return (
        
        <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
          <h1 style={{ marginTop: 0 }}>Employee Document Portal</h1>
    
          {errMsg ? (
            <div style={{ marginBottom: 12 }}>
              <b style={{ color: "tomato" }}>Error:</b> {errMsg}
            </div>
          ) : null}
    
          {/* Auth */}
          {!token ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <label>Email</label>
                <br />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: 260 }}
                />
              </div>
    
              <div style={{ marginBottom: 8 }}>
                <label>Password</label>
                <br />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: 260 }}
                />
              </div>
    
              <button onClick={onLogin}>Login</button>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                Logged in as: <b>{me?.name || me?.email ||  "User"}</b>
              </div>
              <button onClick={onLogout}>Logout</button>
             {!isEmployee && <Link to="/upload">Go Upload</Link>}
            </div>
          )}
    
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Search title..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: 220 }}
              disabled={!token}
            />
    
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!token}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
    
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={!token}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
    
            <select
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              disabled={!token}
            >
              <option value="">All Access</option>
              <option value="public">Public</option>
              <option value="department">Department</option>
              <option value="private">Private</option>
            </select>
    
            <button onClick={onApply} disabled={!token}>
              Apply
            </button>
            <button onClick={onClear} disabled={!token}>
              Clear
            </button>
    
            <button onClick={() => fetchDocs(applied)} disabled={!token || loading}>
              Refresh
            </button>
          </div>
    
          {token && canUpload ? (
      <form onSubmit={onUpload} style={{ marginTop: 16, padding: 12, border: "1px solid #444" }}>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>Upload Document</div>
    
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Title"
            value={uTitle}
            onChange={(e) => setUTitle(e.target.value)}
          />
    
          <input
            placeholder="Description"
            value={uDesc}
            onChange={(e) => setUDesc(e.target.value)}
          />
    
          <select value={uCategoryId} onChange={(e) => setUCategoryId(e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
    
          <select value={uDepartmentId} onChange={(e) => setUDepartmentId(e.target.value)}>
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
    
          <select value={uAccess} onChange={(e) => setUAccess(e.target.value)}>
            <option value="public">Public</option>
            <option value="department">Department</option>
            <option value="private">Private</option>
          </select>
    
          <input
            type="file"
            onChange={(e) => setUFile(e.target.files[0])}
          />
    
          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    ) : null}
    
          {/* Table */}
          <div style={{ marginTop: 16 }}>
            {loading ? <div>Loading...</div> : null}
    
            <table
              border="1"
              cellPadding="8"
              style={{ borderCollapse: "collapse", marginTop: 8, minWidth: 640 }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Download</th>
                  <th>Count</th>
                  <th>Action</th>
                </tr>
              </thead>
             <tbody>
  {!docs.length ? (
    <tr>
      <td colSpan="7">No data</td>
    </tr>
  ) : (
    docs.map((d) => (
      <tr key={d.id}>
        <td>{d.id}</td>
        <td>{d.title}</td>
        <td>{d.category?.name || "-"}</td>
        <td>{d.department?.name || "-"}</td>

        <td>
          <button onClick={() => onDownload(d)}>Download</button>
        </td>

        <td>{d.download_count ?? d.downloadCount ?? 0}</td>

        <td>
          {role === "admin" ||
          (role === "manager" && Number(d.uploaded_by) === Number(userId)) ? (
            <button onClick={() => onDelete(d.id)}>Delete</button>
          ) : null}
        </td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>
    
          <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
            API using: <code>{API_BASE}/...</code>
          </div>
        </div>
      );


  async function onLogout() {
    try {
      await api("/logout", { method: "POST", headers: { ...authHeaders } });
    } catch {}
    localStorage.removeItem("token");
    setToken("");
    nav("/login");
  }
}
