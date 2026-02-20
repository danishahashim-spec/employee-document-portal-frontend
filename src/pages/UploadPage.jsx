import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function UploadPage() {
  const nav = useNavigate();

  const [token] = useState(localStorage.getItem("token") || "");
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  // master data
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [access, setAccess] = useState("public"); // public/department/private
  const [file, setFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    if (!token) {
      nav("/login");
      return;
    }
    // load dropdown data
    (async () => {
      try {
        const [cats, deps] = await Promise.all([
          api("/categories", { headers: { ...authHeaders } }),
          api("/departments", { headers: { ...authHeaders } }),
        ]);
        setCategories(Array.isArray(cats) ? cats : cats?.data || []);
        setDepartments(Array.isArray(deps) ? deps : deps?.data || []);
      } catch (e) {
        setErrMsg(e.message || "Failed to load categories/departments.");
      }
    })();
  }, [token, nav, authHeaders]);

  function validateFile(f) {
    if (!f) return "Please choose a file (PDF).";
    if (f.size > MAX_BYTES) return `File terlalu besar. Max ${MAX_MB}MB.`;

    // validate type (some browser may give empty type, so fallback by extension)
    const isPdfType = f.type === "application/pdf";
    const isPdfExt = f.name?.toLowerCase().endsWith(".pdf");
    if (!isPdfType && !isPdfExt) return "File mesti PDF (.pdf) sahaja.";

    return "";
  }

  async function onUpload(e) {
    e.preventDefault();
    setErrMsg("");
    setOkMsg("");

    if (!token) return setErrMsg("Please login first.");

    if (!title.trim()) return setErrMsg("Title wajib isi.");
    if (!categoryId) return setErrMsg("Select Category dulu.");
    if (!departmentId) return setErrMsg("Select Department dulu.");
    if (!access) return setErrMsg("Select Access dulu.");

    const fileErr = validateFile(file);
    if (fileErr) return setErrMsg(fileErr);

    try {
      setUploading(true);

      const form = new FormData();
      form.append("title", title);
      form.append("description", desc);
      form.append("category_id", categoryId);
      form.append("department_id", departmentId);
      form.append("access_level", access);
      form.append("file", file);

const res = await fetch("http://127.0.0.1:8000/api/v1/documents", {
  method: "POST",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    // JANGAN set Content-Type untuk FormData
  },
  body: form,
});
     

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Upload failed (${res.status})`);
      }

      setOkMsg("Upload success ✅");
      // lepas upload, balik documents
      nav("/documents");
    } catch (e) {
      setErrMsg(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <h2>Upload Document</h2>
      <Link to="/documents">Back</Link>

      <form onSubmit={onUpload} style={{ marginTop: 16, maxWidth: 520 }}>
        {errMsg ? (
          <div style={{ color: "tomato", marginBottom: 10 }}>Error: {errMsg}</div>
        ) : null}
        {okMsg ? (
          <div style={{ color: "lightgreen", marginBottom: 10 }}>{okMsg}</div>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>

          <select value={access} onChange={(e) => setAccess(e.target.value)}>
            <option value="public">Public</option>
            <option value="department">Department</option>
            <option value="private">Private</option>
          </select>

          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f) {
                const msg = validateFile(f);
                setErrMsg(msg);
              } else {
                setErrMsg("");
              }
            }}
          />

          <button disabled={uploading} type="submit">
            {uploading ? "Uploading..." : "Upload"}
          </button>

          <div style={{ opacity: 0.7, fontSize: 12 }}>
            * PDF only, max {MAX_MB}MB
          </div>
        </div>
      </form>
    </div>
  );
}