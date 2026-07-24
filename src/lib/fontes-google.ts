import {
  Anton,
  Archivo_Narrow,
  Barlow_Condensed,
  Bebas_Neue,
  DM_Sans,
  Figtree,
  Fjalla_One,
  Inter,
  Karla,
  Manrope,
  Oswald,
  Rubik,
  Saira_Condensed,
  Source_Sans_3,
  Teko,
  Work_Sans,
} from "next/font/google";
import { FONTES_CORPO, FONTES_TITULO } from "./fontes";

/**
 * Loaders das fontes do catálogo. `next/font` precisa conhecer cada família em
 * tempo de build, então todas são declaradas aqui e o escopo apenas aponta qual
 * usar. O CSS de todas vai para a página, mas o navegador só baixa o arquivo da
 * família efetivamente referenciada por `--font-sans` / `--font-display`.
 *
 * Cada loader precisa da sua própria `const` no escopo do módulo - exigência do
 * plugin do SWC, que reescreve estas chamadas em tempo de compilação. Famílias
 * sem eixo variável exigem `weight` explícito.
 */
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" });
const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });
const karla = Karla({ subsets: ["latin"], variable: "--font-karla" });

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
});
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas-neue" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const archivoNarrow = Archivo_Narrow({ subsets: ["latin"], variable: "--font-archivo-narrow" });
const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-saira-condensed",
});
const fjallaOne = Fjalla_One({ subsets: ["latin"], weight: "400", variable: "--font-fjalla-one" });
const teko = Teko({ subsets: ["latin"], variable: "--font-teko" });

const CORPO = [dmSans, inter, manrope, figtree, workSans, sourceSans, rubik, karla];

const TITULO = [
  barlowCondensed,
  oswald,
  bebasNeue,
  anton,
  archivoNarrow,
  sairaCondensed,
  fjallaOne,
  teko,
];

/**
 * Classes com as variáveis de todas as fontes, aplicadas no `<html>`. Cada
 * escopo escolhe a sua apontando `--font-sans` / `--font-display` para uma
 * destas variáveis.
 */
export const CLASSES_DE_FONTE = [...CORPO, ...TITULO].map((f) => f.variable).join(" ");

// O catálogo e os loaders são listas paralelas: se uma fonte for adicionada em
// `fontes.ts` sem loader aqui, a var apontaria para o nada e a família cairia no
// fallback do sistema, silenciosamente. Falhar no build é melhor.
if (CORPO.length !== FONTES_CORPO.length || TITULO.length !== FONTES_TITULO.length) {
  throw new Error(
    "Catálogo de fontes e loaders fora de sincronia: confira src/lib/fontes.ts e src/lib/fontes-google.ts.",
  );
}
