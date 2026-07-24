import {
  Abril_Fatface,
  Anton,
  Archivo_Black,
  Barlow_Condensed,
  Bebas_Neue,
  DM_Sans,
  Fjalla_One,
  Fraunces,
  Inter,
  Lora,
  Nunito,
  Oswald,
  Playfair_Display,
  Poppins,
  Roboto_Slab,
  Space_Grotesk,
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
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], variable: "--font-roboto-slab" });

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
});
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas-neue" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
});
const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abril-fatface",
});
const fjallaOne = Fjalla_One({ subsets: ["latin"], weight: "400", variable: "--font-fjalla-one" });

const CORPO = [dmSans, poppins, inter, lora, fraunces, nunito, spaceGrotesk, robotoSlab];

const TITULO = [
  barlowCondensed,
  oswald,
  bebasNeue,
  anton,
  playfair,
  archivoBlack,
  abrilFatface,
  fjallaOne,
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
