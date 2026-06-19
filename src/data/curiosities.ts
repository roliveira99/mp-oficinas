export interface Curiosity {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  icon: string;
}

export const curiosities: Curiosity[] = [
  {
    id: "1",
    title: "Por que trocar o óleo a cada 10.000 km?",
    summary:
      "O óleo lubrifica, resfria e limpa o motor. Com o tempo, perde essas propriedades e pode causar desgaste prematuro.",
    content:
      "O óleo do motor é responsável por reduzir o atrito entre as peças móveis, dissipar calor e remover impurezas. Com o uso, ele se degrada e acumula resíduos. Ignorar a troca pode levar a superaquecimento, aumento do consumo de combustível e, em casos graves, quebra do motor. Sempre consulte o manual do fabricante para o intervalo ideal do seu veículo.",
    category: "Manutenção",
    icon: "🛢️",
  },
  {
    id: "2",
    title: "A diferença entre oficina mecânica e concessionária",
    summary:
      "Concessionárias seguem padrões da montadora; oficinas independentes costumam oferecer preços mais acessíveis e atendimento personalizado.",
    content:
      "Concessionárias utilizam peças originais e seguem procedimentos definidos pelo fabricante, o que pode ser exigido para manter a garantia do veículo. Oficinas independentes, quando bem estruturadas, oferecem serviços equivalentes com peças de qualidade (originais ou paralelas certificadas) e frequentemente com custo menor. A escolha depende do tipo de serviço, garantia e orçamento.",
    category: "Mercado",
    icon: "🏪",
  },
  {
    id: "3",
    title: "Motos precisam de mais manutenção que carros?",
    summary:
      "Em geral sim — motos expõem mais componentes ao clima e exigem revisões mais frequentes de corrente, pneus e fluidos.",
    content:
      "Motocicletas ficam mais expostas à chuva, poeira e variações de temperatura. A corrente de transmissão, por exemplo, precisa de lubrificação e ajuste regulares. Pneus de moto também desgastam mais rápido em alguns usos. Por outro lado, motos têm motores menores e menos sistemas complexos, o que simplifica alguns reparos. O ideal é seguir o plano de revisão do fabricante.",
    category: "Motos",
    icon: "🏍️",
  },
  {
    id: "4",
    title: "O que é diagnóstico eletrônico?",
    summary:
      "É a leitura dos sistemas eletrônicos do veículo via scanner OBD, identificando falhas antes que se tornem problemas graves.",
    content:
      "Veículos modernos possuem dezenas de sensores conectados a uma central eletrônica (ECU). O diagnóstico eletrônico utiliza equipamentos que se conectam à porta OBD do carro ou moto e leem códigos de erro. Isso permite identificar falhas em injeção, ABS, airbag, câmbio automático e outros sistemas com precisão, economizando tempo e evitando trocas desnecessárias de peças.",
    category: "Tecnologia",
    icon: "💻",
  },
  {
    id: "5",
    title: "Alinhamento x balanceamento: qual a diferença?",
    summary:
      "Alinhamento ajusta os ângulos das rodas; balanceamento corrige desequilíbrios no pneu e roda para evitar vibrações.",
    content:
      "O alinhamento garante que as rodas estejam na posição correta em relação ao chassi, evitando desgaste irregular dos pneus e puxamento do volante. O balanceamento distribui o peso uniformemente na roda montada, eliminando trepidações em altas velocidades. Ambos devem ser feitos periodicamente ou sempre que trocar pneus, bater em buracos ou notar desgaste irregular.",
    category: "Pneus",
    icon: "🎯",
  },
  {
    id: "6",
    title: "Como escolher uma boa oficina?",
    summary:
      "Verifique avaliações, transparência no orçamento, garantia nos serviços e se a oficina é especializada no seu tipo de veículo.",
    content:
      "Uma oficina confiável explica o problema antes de iniciar o serviço, apresenta orçamento detalhado e oferece garantia. Peça indicações, leia avaliações online e prefira locais com profissionais certificados. Oficinas especializadas (carros, motos ou mistas) tendem a ter ferramentas e conhecimento mais adequados ao seu veículo. Plataformas como o Pesquisa Aqui ajudam a comparar perfis e serviços antes de decidir.",
    category: "Dicas",
    icon: "✅",
  },
];
