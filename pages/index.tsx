
import React, { useMemo, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:3000";

export default function Home() {
  const [token, setToken] = useState<string>("");
  const [authed, setAuthed] = useState(false);

  // Clientes
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newClient, setNewClient] = useState({ display_name: "", tax_id: "", country: "ES" });

  // Documentos
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docMeta, setDocMeta] = useState({ type: "factura", period: "2025-08" });

  // Threads
  const [threadTopic, setThreadTopic] = useState("Soporte inicial");
  const [threadLinked, setThreadLinked] = useState({ linked_type: "general", linked_id: "" });
  const [messageBody, setMessageBody] = useState("Hola, esto es una prueba.");
  const [createdThreadId, setCreatedThreadId] = useState<string>("");

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const authedFetch = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, { ...(init || {}), headers: { ...(init?.headers || {}), ...headers } });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  };

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const data = await authedFetch(`${BASE_URL}/api/v1/clients`);
      setClients(data.data || []);
    } catch (e) {
      console.error(e);
      alert("Error cargando clientes (revisa token/servidor)");
    } finally {
      setLoadingClients(false);
    }
  };

  const createClient = async () => {
    try {
      const data = await authedFetch(`${BASE_URL}/api/v1/clients`, {
        method: "POST",
        body: JSON.stringify(newClient),
      });
      setNewClient({ display_name: "", tax_id: "", country: "ES" });
      await loadClients();
      setSelectedClient(data.data.id);
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el cliente");
    }
  };

  const uploadDocument = async () => {
    if (!docFile || !selectedClient) return alert("Selecciona cliente y archivo");
    try {
      const req = await authedFetch(`${BASE_URL}/api/v1/clients/${selectedClient}/documents`, {
        method: "POST",
        body: JSON.stringify({ filename: docFile.name, type: docMeta.type, period: docMeta.period }),
      });
      const { document_id, upload } = req.data;

      const putRes = await fetch(upload.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": docFile.type || "application/octet-stream" },
        body: docFile,
      });
      if (!putRes.ok) throw new Error("Fallo subiendo a Storage");

      alert(`Documento subido (id: ${document_id})`);
    } catch (e: any) {
      console.error(e);
      alert("Error en subida: " + e.message);
    }
  };

  const createThread = async () => {
    if (!selectedClient) return alert("Selecciona un cliente");
    try {
      const resp = await authedFetch(`${BASE_URL}/api/v1/threads`, {
        method: "POST",
        body: JSON.stringify({
          client_id: selectedClient,
          topic: threadTopic,
          linked_type: threadLinked.linked_type,
          linked_id: threadLinked.linked_id || null,
        }),
      });
      setCreatedThreadId(resp.data.id);
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el hilo");
    }
  };

  const sendMessage = async () => {
    if (!createdThreadId) return alert("Primero crea un hilo");
    try {
      await authedFetch(`${BASE_URL}/api/v1/threads/${createdThreadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: messageBody }),
      });
      alert("Mensaje enviado");
    } catch (e) {
      console.error(e);
      alert("No se pudo enviar el mensaje");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-6">
      <div className="max-w-6xl mx-auto grid gap-6">
        <Header />

        <Card title="1) Login (pega tu JWT de Supabase)">
          <div className="flex flex-col md:flex-row gap-3 items-start">
            <textarea
              className="w-full md:flex-1 border rounded-lg p-3 font-mono text-xs"
              placeholder="Pegue aquí su token JWT de Supabase (session.access_token)"
              rows={3}
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              onClick={() => setAuthed(Boolean(token))}
              disabled={!token}
            >
              Usar token
            </button>
          </div>
          <p className="text-sm text-zinc-500 mt-2">BFF: <code>{BASE_URL}</code></p>
        </Card>

        <Card title="2) Clientes (listar / crear)">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-3 py-2 rounded-xl border" onClick={loadClients} disabled={!authed}>
              Cargar clientes
            </button>
            <span className="text-xs text-zinc-500">{loadingClients ? "Cargando…" : null}</span>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Listado</h3>
              <ul className="space-y-2">
                {clients.map((c) => (
                  <li key={c.id} className={`p-3 rounded-xl border ${selectedClient === c.id ? "border-black" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.display_name}</div>
                        <div className="text-xs text-zinc-500">{c.tax_id} · {c.country}</div>
                      </div>
                      <button className="text-sm underline" onClick={() => setSelectedClient(c.id)}>Seleccionar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Crear cliente</h3>
              <div className="grid gap-2">
                <input className="border rounded-lg p-2" placeholder="Nombre comercial" value={newClient.display_name}
                  onChange={(e) => setNewClient({ ...newClient, display_name: e.target.value })} />
                <input className="border rounded-lg p-2" placeholder="NIF/CIF" value={newClient.tax_id}
                  onChange={(e) => setNewClient({ ...newClient, tax_id: e.target.value })} />
                <input className="border rounded-lg p-2" placeholder="País" value={newClient.country}
                  onChange={(e) => setNewClient({ ...newClient, country: e.target.value })} />
                <button className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50" onClick={createClient} disabled={!authed}>
                  Crear
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="3) Subida de documentos">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <select className="border rounded-lg p-2" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="">— Selecciona cliente —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
              <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded-lg p-2" placeholder="Tipo (factura/nomina/...)" value={docMeta.type}
                  onChange={(e) => setDocMeta({ ...docMeta, type: e.target.value })} />
                <input className="border rounded-lg p-2" placeholder="Periodo (YYYY-MM o YYYY-Qn)" value={docMeta.period}
                  onChange={(e) => setDocMeta({ ...docMeta, period: e.target.value })} />
              </div>
              <button className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50" onClick={uploadDocument} disabled={!authed || !docFile || !selectedClient}>
                Subir documento
              </button>
            </div>

            <div className="text-sm text-zinc-600">
              <p>Flujo:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>El BFF crea URL firmada en Supabase Storage.</li>
                <li>Este front sube el archivo directo a esa URL.</li>
                <li>Se notifica OK y el gestor lo verá en el listado interno.</li>
              </ol>
            </div>
          </div>
        </Card>

        <Card title="4) Threads (hilo + mensaje)">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <select className="border rounded-lg p-2" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="">— Selecciona cliente —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
              <input className="border rounded-lg p-2" placeholder="Tema del hilo" value={threadTopic}
                onChange={(e) => setThreadTopic(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <select className="border rounded-lg p-2" value={threadLinked.linked_type}
                  onChange={(e) => setThreadLinked({ ...threadLinked, linked_type: e.target.value })}>
                  <option value="general">general</option>
                  <option value="task">task</option>
                  <option value="filing">filing</option>
                </select>
                <input className="border rounded-lg p-2" placeholder="linked_id (opcional)" value={threadLinked.linked_id}
                  onChange={(e) => setThreadLinked({ ...threadLinked, linked_id: e.target.value })} />
              </div>
              <button className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50" onClick={createThread} disabled={!authed || !selectedClient}>
                Crear hilo
              </button>
            </div>

            <div className="grid gap-2">
              <textarea className="border rounded-lg p-2" rows={4} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
              <button className="px-4 py-2 rounded-xl border" onClick={sendMessage} disabled={!createdThreadId || !authed}>
                Enviar mensaje al hilo #{createdThreadId.slice(0, 8) || "—"}
              </button>
            </div>
          </div>
        </Card>

        <Footer />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700" />
        <div>
          <h1 className="text-xl font-semibold">Gestorly — Demo MVP</h1>
          <p className="text-xs text-zinc-500">Login → Clientes → Documentos → Threads</p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Footer() {
  return (
    <div className="text-center text-xs text-zinc-500 py-6">
      v0.1 · Demo Next.js para Vercel · Utiliza NEXT_PUBLIC_BFF_URL para apuntar al backend
    </div>
  );
}
