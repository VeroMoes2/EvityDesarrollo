import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Share2, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LabAnalyte {
  id: string;
  analyteName: string;
  valueNumeric: string;
  unit: string;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  collectedAt: string | null;
  createdAt: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface AnalyteComment {
  id: string;
  userId: string;
  analyteName: string;
  comment: string;
  createdAt: string;
}

const ANALYTE_DESCRIPTIONS: Record<string, string> = {
  "colesterol total": "El colesterol total es la suma de todos los tipos de colesterol en la sangre. Un nivel alto puede aumentar el riesgo de enfermedades cardíacas. Incluye el colesterol de lipoproteínas de baja densidad (LDL) y de alta densidad (HDL).",
  "colesterol hdl": "El colesterol HDL (lipoproteína de alta densidad) es conocido como el 'colesterol bueno' porque ayuda a eliminar otras formas de colesterol del torrente sanguíneo. Niveles más altos de HDL están asociados con menor riesgo cardiovascular.",
  "colesterol ldl": "El colesterol LDL (lipoproteína de baja densidad) es conocido como el 'colesterol malo' porque puede acumularse en las paredes de las arterias y formar placas. Niveles altos aumentan el riesgo de enfermedades cardíacas.",
  "triglicéridos": "Los triglicéridos son un tipo de grasa en la sangre. Niveles elevados pueden contribuir al endurecimiento de las arterias y aumentar el riesgo de enfermedades del corazón, especialmente cuando se combinan con colesterol alto.",
  "glucosa": "La glucosa es el principal azúcar en la sangre y la fuente de energía más importante para tu cuerpo. Niveles elevados pueden indicar diabetes o prediabetes.",
  "hemoglobina": "La hemoglobina es una proteína en los glóbulos rojos que transporta oxígeno. Niveles bajos pueden indicar anemia, mientras que niveles altos pueden estar relacionados con deshidratación o enfermedades pulmonares.",
  "creatinina": "La creatinina es un producto de desecho muscular filtrado por los riñones. Es un indicador importante de la función renal. Niveles elevados pueden sugerir problemas renales.",
  "tsh": "La TSH (hormona estimulante de la tiroides) regula la función de la glándula tiroides. Niveles anormales pueden indicar hipotiroidismo o hipertiroidismo.",
  "vitamina d": "La vitamina D es esencial para la salud ósea y el sistema inmunológico. La deficiencia es común y puede causar debilidad muscular y problemas óseos.",
  "hierro": "El hierro es esencial para producir hemoglobina. Niveles bajos pueden causar anemia por deficiencia de hierro, mientras que niveles muy altos pueden ser tóxicos.",
  "ácido úrico": "El ácido úrico es un producto de desecho del metabolismo de las purinas. Niveles elevados pueden causar gota y están asociados con enfermedades renales y cardiovasculares.",
};

function getAnalyteDescription(analyteName: string): string {
  const lowerName = analyteName.toLowerCase();
  for (const [key, description] of Object.entries(ANALYTE_DESCRIPTIONS)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return description;
    }
  }
  return `${analyteName} es un marcador importante en los análisis de laboratorio. Consulta con tu médico para entender mejor qué significan tus resultados y cómo pueden afectar tu salud.`;
}

function getStatusInfo(value: number, min: number | null, max: number | null): { 
  status: "optimal" | "borderline" | "high";
  color: string;
  textColor: string;
} {
  if (min !== null && max !== null) {
    if (value >= min && value <= max) {
      return { status: "optimal", color: "text-teal-600", textColor: "text-teal-600" };
    }
    const deviation = value < min 
      ? (min - value) / min 
      : (value - max) / max;
    if (deviation > 0.15) {
      return { status: "high", color: "text-red-500", textColor: "text-red-500" };
    }
    return { status: "borderline", color: "text-amber-500", textColor: "text-amber-500" };
  }
  
  if (min !== null && value < min) {
    const deviation = (min - value) / min;
    return deviation > 0.15 
      ? { status: "high", color: "text-red-500", textColor: "text-red-500" }
      : { status: "borderline", color: "text-amber-500", textColor: "text-amber-500" };
  }
  if (max !== null && value > max) {
    const deviation = (value - max) / max;
    return deviation > 0.15 
      ? { status: "high", color: "text-red-500", textColor: "text-red-500" }
      : { status: "borderline", color: "text-amber-500", textColor: "text-amber-500" };
  }
  
  return { status: "optimal", color: "text-teal-600", textColor: "text-teal-600" };
}

function ReferenceRangeBar({ 
  value, 
  min, 
  max,
  unit 
}: { 
  value: number; 
  min: number | null; 
  max: number | null;
  unit: string;
}) {
  const displayMin = min ?? 0;
  const displayMax = max ?? (value * 1.5);
  const highThreshold = displayMax * 1.2;
  
  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-700/50 p-5">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-4">Rango de Referencia</h3>
      <div className="relative h-3 rounded-full overflow-hidden flex">
        <div className="flex-1 bg-teal-400" />
        <div className="flex-1 bg-amber-400" />
        <div className="flex-1 bg-red-400" />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>&lt;{displayMax} Deseable</span>
        <span>{displayMax}-{Math.round(highThreshold)} Límite</span>
        <span>&gt;{Math.round(highThreshold)} Alto</span>
      </div>
    </div>
  );
}

function HistoricalChart({ 
  history, 
  profileImageUrl,
  currentValue 
}: { 
  history: LabAnalyte[]; 
  profileImageUrl?: string;
  currentValue: number;
}) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    const sorted = [...history].sort((a, b) => {
      const dateA = a.collectedAt ? new Date(a.collectedAt).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.collectedAt ? new Date(b.collectedAt).getTime() : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
    
    return sorted.map(item => ({
      value: parseFloat(item.valueNumeric),
      date: item.collectedAt ? new Date(item.collectedAt) : new Date(item.createdAt),
    }));
  }, [history]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-700/50 p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-4">Tendencia Histórica</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No hay suficientes datos para mostrar la tendencia histórica.
        </p>
      </div>
    );
  }

  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values) * 0.9;
  const maxValue = Math.max(...values) * 1.1;
  const range = maxValue - minValue || 1;

  const width = 300;
  const height = 140;
  const padding = { top: 20, right: 40, bottom: 40, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = chartData.map((d, i) => ({
    x: padding.left + (i / Math.max(chartData.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
    value: d.value,
    isLast: i === chartData.length - 1,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const formatDateLabel = (date: Date): string => {
    return format(date, "dd/MM/yy", { locale: es });
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-700/50 p-5">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-4">Tendencia Histórica</h3>
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[300px]">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.02" />
            </linearGradient>
            <clipPath id="avatarClip">
              <circle r="12" />
            </clipPath>
          </defs>
          
          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={linePath} fill="none" stroke="#000000" strokeWidth="2" />
          
          {points.map((p, i) => {
            if (p.isLast) {
              return (
                <g key={i}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#000000" 
                  />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className="fill-gray-600 dark:fill-gray-300 text-[9px] font-medium"
                  >
                    {p.value}
                  </text>
                  <g transform={`translate(${p.x}, ${p.y})`}>
                    {profileImageUrl ? (
                      <>
                        <circle r="14" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                        <clipPath id={`clip-${i}`}>
                          <circle r="12" />
                        </clipPath>
                        <image 
                          href={profileImageUrl} 
                          x="-12" 
                          y="-12" 
                          width="24" 
                          height="24" 
                          clipPath={`url(#clip-${i})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </>
                    ) : (
                      <>
                        <circle r="10" fill="#fbbf24" />
                        <polygon 
                          points="0,-6 1.5,-2 6,-2 2.5,1 4,5 0,2.5 -4,5 -2.5,1 -6,-2 -1.5,-2" 
                          fill="white"
                        />
                      </>
                    )}
                  </g>
                </g>
              );
            }
            return (
              <g key={i}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="#000000" 
                />
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-300 text-[9px] font-medium"
                >
                  {p.value}
                </text>
              </g>
            );
          })}
          
          {chartData.length <= 5 ? (
            chartData.map((d, i) => (
              <text
                key={`label-${i}`}
                x={points[i].x}
                y={height - 5}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-500 text-[9px]"
              >
                {formatDateLabel(d.date)}
              </text>
            ))
          ) : (
            [0, Math.floor(chartData.length / 2), chartData.length - 1].map((idx) => (
              <text
                key={`label-${idx}`}
                x={points[idx].x}
                y={height - 5}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-500 text-[9px]"
              >
                {formatDateLabel(chartData[idx].date)}
              </text>
            ))
          )}
        </svg>
      </div>
    </div>
  );
}

function CommentsSection({ analyteName }: { analyteName: string }) {
  const [newComment, setNewComment] = useState("");

  const { data: commentsData, isLoading: commentsLoading } = useQuery<{ comments: AnalyteComment[] }>({
    queryKey: ["/api/labs/analytes/comments", encodeURIComponent(analyteName)],
    enabled: !!analyteName,
  });

  const createMutation = useMutation({
    mutationFn: async (comment: string) => {
      return apiRequest("POST", `/api/labs/analytes/comments/${encodeURIComponent(analyteName)}`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs/analytes/comments", encodeURIComponent(analyteName)] });
      setNewComment("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/labs/analytes/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs/analytes/comments", encodeURIComponent(analyteName)] });
    },
  });

  const handleSubmit = () => {
    if (newComment.trim()) {
      createMutation.mutate(newComment.trim());
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es }).toUpperCase();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-700/50 p-5">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-4">Comentarios y Anotaciones</h3>
      
      <div className="mb-4">
        <Textarea
          placeholder="Añade una nota para esta fecha..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
          data-testid="textarea-new-comment"
        />
        <div className="flex justify-end mt-2">
          <Button 
            onClick={handleSubmit}
            disabled={!newComment.trim() || createMutation.isPending}
            data-testid="button-add-comment"
          >
            {createMutation.isPending ? "Guardando..." : "Añadir Comentario"}
          </Button>
        </div>
      </div>

      {commentsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full dark:bg-[#2a2a2a]" />
          <Skeleton className="h-16 w-full dark:bg-[#2a2a2a]" />
        </div>
      ) : commentsData?.comments && commentsData.comments.length > 0 ? (
        <div className="space-y-3">
          {commentsData.comments.map((comment) => (
            <div 
              key={comment.id} 
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50"
              data-testid={`comment-item-${comment.id}`}
            >
              <MessageSquare className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">
                  {formatDate(comment.createdAt)}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {comment.comment}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  onClick={() => deleteMutation.mutate(comment.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-comment-${comment.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No hay comentarios aún. Añade una nota sobre tus resultados.
        </p>
      )}
    </div>
  );
}

export default function AnalyteDetail() {
  const [, params] = useRoute("/analito/:analyteName");
  const analyteName = params?.analyteName ? decodeURIComponent(params.analyteName) : "";

  const { data: historyData, isLoading: historyLoading } = useQuery<{ analyteName: string; history: LabAnalyte[] }>({
    queryKey: ["/api/labs/analytes/history", encodeURIComponent(analyteName)],
    enabled: !!analyteName,
  });

  const { data: userData } = useQuery<UserProfile>({
    queryKey: ["/api/user"],
  });

  const latestAnalyte = useMemo(() => {
    if (!historyData?.history || historyData.history.length === 0) return null;
    return historyData.history[0];
  }, [historyData]);

  const numericValue = latestAnalyte ? parseFloat(latestAnalyte.valueNumeric) : 0;
  const refMin = latestAnalyte?.referenceMin ? parseFloat(latestAnalyte.referenceMin) : null;
  const refMax = latestAnalyte?.referenceMax ? parseFloat(latestAnalyte.referenceMax) : null;
  const statusInfo = getStatusInfo(numericValue, refMin, refMax);
  const description = getAnalyteDescription(analyteName);

  if (historyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] dark:bg-[#121212] p-4">
        <Skeleton className="h-10 w-24 mb-8 dark:bg-[#1e1e1e]" />
        <Skeleton className="h-12 w-48 mx-auto mb-4 dark:bg-[#1e1e1e]" />
        <Skeleton className="h-20 w-32 mx-auto mb-8 dark:bg-[#1e1e1e]" />
        <Skeleton className="h-24 w-full mb-4 dark:bg-[#1e1e1e]" />
        <Skeleton className="h-40 w-full mb-4 dark:bg-[#1e1e1e]" />
        <Skeleton className="h-32 w-full dark:bg-[#1e1e1e]" />
      </div>
    );
  }

  if (!latestAnalyte) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] dark:bg-[#121212] p-4">
        <Link href="/mis-analitos">
          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" data-testid="button-back-analytes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2" style={{ fontFamily: "'Merriweather', serif" }}>
            Analito no encontrado
          </h2>
          <p className="text-gray-500 dark:text-gray-400">No se encontraron datos para este analito.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] dark:bg-[#121212]">
      <div className="flex items-center justify-between p-4">
        <Link href="/mis-analitos">
          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" data-testid="button-back-analytes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" data-testid="button-share-analyte">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center px-4 pb-8">
        <h1 
          className="text-3xl text-gray-800 dark:text-amber-100 mb-3" 
          style={{ fontFamily: "'Merriweather', serif" }}
          data-testid="text-analyte-name"
        >
          {analyteName}
        </h1>
        <div className={`text-5xl font-bold ${statusInfo.textColor} mb-1`} data-testid="text-analyte-value">
          {latestAnalyte.valueNumeric}
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm" data-testid="text-analyte-unit">
          {latestAnalyte.unit}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 space-y-4 pb-8">
        <ReferenceRangeBar 
          value={numericValue}
          min={refMin}
          max={refMax}
          unit={latestAnalyte.unit}
        />

        <HistoricalChart 
          history={historyData?.history || []}
          profileImageUrl={userData?.profileImageUrl}
          currentValue={numericValue}
        />

        <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-gray-700/50 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-3">Acerca del {analyteName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        <CommentsSection analyteName={analyteName} />
      </div>
    </div>
  );
}
