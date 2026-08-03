import { AbsoluteFill, Sequence } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal, useDrift } from "../components/Reveal";
import { Kicker, Title, Body, Panel, Disclaimer } from "../components/Ui";

const modules = [
  { tag: "MBI", name: "Inventario de Burnout", desc: "Agotamiento, despersonalización y realización personal.", icon: "◑" },
  { tag: "Salud", name: "Cuestionario de Salud Laboral", desc: "5 dimensiones de salud integral en el trabajo.", icon: "◈" },
  { tag: "Sensei", name: "Bot de acompañamiento", desc: "Sesiones guiadas de bienestar y pausas activas.", icon: "◍" },
];

export const Scene2: React.FC = () => {
  const drift = useDrift(7, 0.018);
  return (
    <AbsoluteFill style={{ padding: "0 110px", justifyContent: "center" }}>
      <Reveal delay={0}>
        <Kicker>Evaluación</Kicker>
      </Reveal>
      <Reveal delay={10} style={{ marginTop: 20, maxWidth: 1100 }}>
        <Title size={78}>Tres instrumentos, una sola lectura del riesgo.</Title>
      </Reveal>
      <div style={{ display: "flex", gap: 28, marginTop: 66 }}>
        {modules.map((m, i) => (
          <Sequence key={m.tag} from={40 + i * 16} layout="none">
            <Reveal delay={0} style={{ flex: 1 }}>
              <Panel style={{ transform: `translateY(${drift * (i % 2 === 0 ? 1 : -1)}px)`, height: 330, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontSize: 46, color: i === 2 ? C.gold : C.teal, fontFamily: sans }}>{m.icon}</div>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 17, letterSpacing: 4, textTransform: "uppercase", color: i === 2 ? C.gold : C.teal, marginBottom: 14 }}>
                    {m.tag}
                  </div>
                  <div style={{ fontFamily: display, fontSize: 38, color: C.ivory, lineHeight: 1.1, marginBottom: 16 }}>{m.name}</div>
                  <Body size={22}>{m.desc}</Body>
                </div>
              </Panel>
            </Reveal>
          </Sequence>
        ))}
      </div>
      <Disclaimer>Dato individual privado · agregado anónimo para dirección</Disclaimer>
    </AbsoluteFill>
  );
};
