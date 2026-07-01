import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { FileText, Upload, Trash2, Download, Loader2, Eye, FilePlus } from "lucide-react";

const BASE_URL = "https://saude-na-mao-qt2w.onrender.com";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(str) {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ProtocoloAnexos({ protocoloId, canUpload = false, canDelete = false, getAnexosFn, uploadAnexoFn, deleteAnexoFn }) {
  const [anexos, setAnexos] = useState([]);
  const [loadingAnexos, setLoadingAnexos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const loadAnexos = useCallback(async () => {
    try {
      const data = await getAnexosFn(protocoloId);
      setAnexos(data);
    } catch {
      // silencioso
    } finally {
      setLoadingAnexos(false);
    }
  }, [protocoloId, getAnexosFn]);

  useEffect(() => { loadAnexos(); }, [loadAnexos]);

  async function handleUpload(file) {
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Apenas arquivos PDF são permitidos."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo: 10MB."); return; }
    setUploading(true);
    try {
      await uploadAnexoFn(protocoloId, file);
      toast.success("PDF enviado com sucesso!");
      await loadAnexos();
    } catch {
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(anexoId, nomeArquivo) {
    if (!window.confirm(`Remover "${nomeArquivo}"?`)) return;
    setDeletingId(anexoId);
    try {
      await deleteAnexoFn(protocoloId, anexoId);
      toast.success("Anexo removido.");
      setAnexos(prev => prev.filter(a => a.id !== anexoId));
    } catch {
      toast.error("Erro ao remover anexo.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="ficha-section" style={{ marginTop: 24 }}>
      <div className="ficha-section-title" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <FilePlus size={18} />
        Anexos de Exames (PDF)
      </div>

      {canUpload && (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}
          style={{
            border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
            borderRadius: 12, padding: "24px 16px", textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: isDragging ? "rgba(0,100,200,0.06)" : "rgba(0,0,0,0.02)",
            transition: "all 0.2s ease", marginBottom: 16, opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Enviando PDF...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Upload size={28} style={{ color: "var(--primary)", opacity: 0.8 }} />
              <div>
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>Clique ou arraste um PDF aqui</span>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>Apenas PDF • Máximo 10MB</div>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        </div>
      )}

      {loadingAnexos ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: "0.9rem", padding: "8px 0" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          Carregando anexos...
        </div>
      ) : anexos.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "20px 16px", color: "var(--text-secondary)",
          fontSize: "0.9rem", background: "rgba(0,0,0,0.02)", borderRadius: 10, border: "1px solid var(--border)",
        }}>
          <FileText size={24} style={{ marginBottom: 6, opacity: 0.4 }} />
          <div>Nenhum PDF anexado a este protocolo.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {anexos.map(anexo => (
            <div key={anexo.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              background: "var(--surface, white)", border: "1px solid var(--border)", borderRadius: 10,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: "rgba(220,38,38,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <FileText size={20} style={{ color: "#dc2626" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {anexo.nome_arquivo}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2, display: "flex", gap: 8 }}>
                  {anexo.tamanho && <span>{formatFileSize(anexo.tamanho)}</span>}
                  <span>{formatDateTime(anexo.uploaded_at)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <a href={`${BASE_URL}/uploads/${anexo.caminho}`} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px",
                    borderRadius: 7, border: "1px solid var(--primary)", color: "var(--primary)",
                    background: "transparent", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
                  }}>
                  <Eye size={14} /> Ver
                </a>
                <a href={`${BASE_URL}/uploads/${anexo.caminho}`} download={anexo.nome_arquivo}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px",
                    borderRadius: 7, border: "1px solid var(--border)", color: "var(--text-secondary)",
                    background: "transparent", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
                  }}>
                  <Download size={14} /> Baixar
                </a>
                {canDelete && (
                  <button onClick={() => handleDelete(anexo.id, anexo.nome_arquivo)} disabled={deletingId === anexo.id}
                    style={{
                      display: "inline-flex", alignItems: "center", padding: "6px 8px",
                      borderRadius: 7, border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626",
                      background: "transparent", cursor: "pointer",
                    }}>
                    {deletingId === anexo.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
