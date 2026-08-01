-- Restore the default Plays from the catalog introduced by migration 026.
-- Each edition receives a rotating set of ten questions.

do $$
declare
  catalog jsonb := $catalog$
  [
    {
      "slug": "matematica",
      "questions": [
        [
          "Quanto é 7 × 8?",
          "56",
          [
            "51",
            "59",
            "50"
          ]
        ],
        [
          "Qual é a raiz quadrada de 81?",
          "9",
          [
            "4",
            "12",
            "14"
          ]
        ],
        [
          "Quanto é 15% de 200?",
          "30",
          [
            "33",
            "31",
            "27"
          ]
        ],
        [
          "Qual fração equivale a 0,5?",
          "1/2",
          [
            "2/3",
            "3/4",
            "1/3"
          ]
        ],
        [
          "Quanto é 144 ÷ 12?",
          "12",
          [
            "13",
            "14",
            "22"
          ]
        ],
        [
          "Qual é o próximo número primo após 11?",
          "13",
          [
            "15",
            "23",
            "8"
          ]
        ],
        [
          "Um triângulo tem quantos lados?",
          "3",
          [
            "13",
            "8",
            "5"
          ]
        ],
        [
          "Quanto é 2 elevado à quinta potência?",
          "32",
          [
            "34",
            "33",
            "42"
          ]
        ],
        [
          "Qual é a soma dos ângulos internos de um triângulo?",
          "180°",
          [
            "177°",
            "185°",
            "175°"
          ]
        ],
        [
          "Quanto é 3,5 + 2,75?",
          "6,25",
          [
            "7,25",
            "16,25",
            "1,25"
          ]
        ],
        [
          "Quanto é 9 × 7?",
          "63",
          [
            "58",
            "64",
            "68"
          ]
        ],
        [
          "Quanto é 96 ÷ 8?",
          "12",
          [
            "15",
            "13",
            "10"
          ]
        ],
        [
          "Quanto é 25% de 80?",
          "20",
          [
            "18",
            "17",
            "21"
          ]
        ],
        [
          "Qual é a raiz quadrada de 121?",
          "11",
          [
            "14",
            "16",
            "1"
          ]
        ],
        [
          "Quanto é 3 elevado à quarta potência?",
          "81",
          [
            "78",
            "86",
            "79"
          ]
        ],
        [
          "Qual é o dobro de 37?",
          "74",
          [
            "67",
            "69",
            "79"
          ]
        ],
        [
          "Qual é a metade de 150?",
          "75",
          [
            "65",
            "78",
            "70"
          ]
        ],
        [
          "Quanto é 18 + 27?",
          "45",
          [
            "49",
            "35",
            "48"
          ]
        ],
        [
          "Quanto é 100 - 46?",
          "54",
          [
            "53",
            "44",
            "52"
          ]
        ],
        [
          "Quanto é 14 × 6?",
          "84",
          [
            "81",
            "85",
            "82"
          ]
        ],
        [
          "Qual fração representa 25%?",
          "1/4",
          [
            "3/4",
            "1/2",
            "3/5"
          ]
        ],
        [
          "Quanto é 0,75 em forma de fração simplificada?",
          "3/4",
          [
            "3/5",
            "1/2",
            "2/3"
          ]
        ],
        [
          "Quantos graus tem um ângulo reto?",
          "90°",
          [
            "87°",
            "92°",
            "81°"
          ]
        ],
        [
          "Quantos lados tem um octógono?",
          "8",
          [
            "7",
            "10",
            "6"
          ]
        ],
        [
          "Qual é o perímetro de um quadrado de lado 5 cm?",
          "20 cm",
          [
            "15 cm",
            "25 cm",
            "10 cm"
          ]
        ],
        [
          "Qual é a área de um quadrado de lado 6 cm?",
          "36 cm²",
          [
            "38 cm²",
            "35 cm²",
            "40 cm²"
          ]
        ],
        [
          "Qual é a área de um retângulo de 8 cm por 3 cm?",
          "24 cm²",
          [
            "22 cm²",
            "29 cm²",
            "25 cm²"
          ]
        ],
        [
          "Quanto é 5! (cinco fatorial)?",
          "120",
          [
            "130",
            "122",
            "121"
          ]
        ],
        [
          "Qual é o próximo número da sequência 2, 4, 8, 16?",
          "32",
          [
            "30",
            "34",
            "42"
          ]
        ],
        [
          "Qual é o mínimo múltiplo comum de 4 e 6?",
          "12",
          [
            "14",
            "7",
            "17"
          ]
        ],
        [
          "Qual é o máximo divisor comum de 18 e 24?",
          "6",
          [
            "11",
            "16",
            "9"
          ]
        ],
        [
          "Quanto é 2/3 de 30?",
          "20",
          [
            "30",
            "15",
            "17"
          ]
        ],
        [
          "Quanto é 1,2 + 3,8?",
          "5",
          [
            "7",
            "4",
            "8"
          ]
        ],
        [
          "Quanto é 7,5 - 2,25?",
          "5,25",
          [
            "10,25",
            "7,25",
            "4,25"
          ]
        ],
        [
          "Quanto é 4,2 × 10?",
          "42",
          [
            "43",
            "40",
            "37"
          ]
        ],
        [
          "Quanto é 360 ÷ 9?",
          "40",
          [
            "44",
            "42",
            "45"
          ]
        ],
        [
          "Qual é o valor de x em x + 7 = 15?",
          "8",
          [
            "11",
            "6",
            "5"
          ]
        ],
        [
          "Qual é o valor de x em 3x = 21?",
          "7",
          [
            "12",
            "9",
            "10"
          ]
        ],
        [
          "Qual número romano representa 50?",
          "L",
          [
            "V",
            "D",
            "M"
          ]
        ],
        [
          "Qual número romano representa 100?",
          "C",
          [
            "D",
            "X",
            "L"
          ]
        ],
        [
          "Quantos minutos há em 2 horas?",
          "120",
          [
            "122",
            "117",
            "123"
          ]
        ],
        [
          "Quantos segundos há em 3 minutos?",
          "180",
          [
            "182",
            "170",
            "198"
          ]
        ],
        [
          "Qual é a média de 6, 8 e 10?",
          "8",
          [
            "13",
            "5",
            "18"
          ]
        ],
        [
          "Quanto é 10% de 350?",
          "35",
          [
            "45",
            "34",
            "40"
          ]
        ],
        [
          "Quanto é 30% de 90?",
          "27",
          [
            "37",
            "24",
            "17"
          ]
        ],
        [
          "Qual é o valor aproximado de π com duas casas decimais?",
          "3,14",
          [
            "1,14",
            "6,14",
            "13,14"
          ]
        ],
        [
          "Quantas diagonais tem um quadrado?",
          "2",
          [
            "4",
            "3",
            "5"
          ]
        ],
        [
          "Qual é o nome de um triângulo com três lados iguais?",
          "Equilátero",
          [
            "Retângulo",
            "Escaleno",
            "Isósceles"
          ]
        ],
        [
          "Qual é o nome de um ângulo maior que 90° e menor que 180°?",
          "Obtuso",
          [
            "Reto",
            "Agudo",
            "Raso"
          ]
        ],
        [
          "Quanto é (-5) + 12?",
          "7",
          [
            "8",
            "2",
            "12"
          ]
        ]
      ]
    },
    {
      "slug": "portugues",
      "questions": [
        [
          "Qual é o plural de cidadão?",
          "cidadãos",
          [
            "verbo",
            "conjunção",
            "artigo"
          ]
        ],
        [
          "Qual palavra é um verbo?",
          "correr",
          [
            "conjunção",
            "pronome",
            "verbo"
          ]
        ],
        [
          "Qual é o antônimo de claro?",
          "escuro",
          [
            "substantivo",
            "adjetivo",
            "advérbio"
          ]
        ],
        [
          "Em 'A menina leu o livro', qual é o sujeito?",
          "A menina",
          [
            "artigo",
            "adjetivo",
            "pronome"
          ]
        ],
        [
          "Qual palavra está corretamente acentuada?",
          "lâmpada",
          [
            "preposição",
            "adjetivo",
            "pronome"
          ]
        ],
        [
          "Qual é um sinônimo de feliz?",
          "contente",
          [
            "artigo",
            "substantivo",
            "pronome"
          ]
        ],
        [
          "Qual sinal encerra uma pergunta?",
          "ponto de interrogação",
          [
            "vírgula",
            "ponto final",
            "travessão"
          ]
        ],
        [
          "Qual palavra é um substantivo próprio?",
          "Brasil",
          [
            "artigo",
            "adjetivo",
            "preposição"
          ]
        ],
        [
          "Qual é o diminutivo de casa?",
          "casinha",
          [
            "advérbio",
            "adjetivo",
            "conjunção"
          ]
        ],
        [
          "Em qual opção há encontro vocálico?",
          "saída",
          [
            "artigo",
            "advérbio",
            "pronome"
          ]
        ],
        [
          "Qual é o plural de pão?",
          "pães",
          [
            "pãos",
            "pães-es",
            "pãoses"
          ]
        ],
        [
          "Qual é o feminino de cavalo?",
          "égua",
          [
            "cavala",
            "potra",
            "mula"
          ]
        ],
        [
          "Qual palavra é um adjetivo?",
          "bonito",
          [
            "beleza",
            "embelezar",
            "belamente"
          ]
        ],
        [
          "Qual palavra é um advérbio?",
          "rapidamente",
          [
            "rápido",
            "rapidez",
            "acelerar"
          ]
        ],
        [
          "Qual é o antônimo de antigo?",
          "moderno",
          [
            "velho",
            "passado",
            "ancestral"
          ]
        ],
        [
          "Qual é um sinônimo de iniciar?",
          "começar",
          [
            "encerrar",
            "interromper",
            "adiar"
          ]
        ],
        [
          "Em “Pedro comprou frutas”, qual é o predicado?",
          "comprou frutas",
          [
            "artigo",
            "adjetivo",
            "conjunção"
          ]
        ],
        [
          "Em “Os alunos estudaram”, qual é o núcleo do sujeito?",
          "alunos",
          [
            "substantivo",
            "verbo",
            "artigo"
          ]
        ],
        [
          "Qual palavra apresenta dígrafo?",
          "chuva",
          [
            "saída",
            "poeta",
            "aula"
          ]
        ],
        [
          "Qual palavra possui hiato?",
          "saúde",
          [
            "pai",
            "caixa",
            "mãe"
          ]
        ],
        [
          "Qual palavra possui ditongo?",
          "pai",
          [
            "saúde",
            "poeta",
            "saída"
          ]
        ],
        [
          "Qual opção contém pronome pessoal?",
          "ela",
          [
            "pronome",
            "preposição",
            "substantivo"
          ]
        ],
        [
          "Qual opção contém artigo definido?",
          "o",
          [
            "advérbio",
            "verbo",
            "adjetivo"
          ]
        ],
        [
          "Qual opção contém preposição?",
          "com",
          [
            "conjunção",
            "preposição",
            "advérbio"
          ]
        ],
        [
          "Qual opção contém conjunção?",
          "porque",
          [
            "substantivo",
            "verbo",
            "preposição"
          ]
        ],
        [
          "Qual é o aumentativo de casa?",
          "casarão",
          [
            "verbo",
            "adjetivo",
            "pronome"
          ]
        ],
        [
          "Qual é o diminutivo de gato?",
          "gatinho",
          [
            "pronome",
            "adjetivo",
            "advérbio"
          ]
        ],
        [
          "Qual palavra está escrita corretamente?",
          "exceção",
          [
            "substantivo",
            "artigo",
            "preposição"
          ]
        ],
        [
          "Qual destas palavras está grafada corretamente?",
          "beneficente",
          [
            "verbo",
            "preposição",
            "artigo"
          ]
        ],
        [
          "Qual palavra recebe acento por ser proparoxítona?",
          "médico",
          [
            "monossílabo tônico",
            "paroxítona",
            "proparoxítona"
          ]
        ],
        [
          "Qual é a sílaba tônica de “janela”?",
          "ne",
          [
            "ja",
            "la",
            "jane"
          ]
        ],
        [
          "Quantas sílabas tem a palavra “computador”?",
          "4",
          [
            "3",
            "5",
            "6"
          ]
        ],
        [
          "Qual é o coletivo de peixes?",
          "cardume",
          [
            "alcateia",
            "rebanho",
            "enxame"
          ]
        ],
        [
          "Qual é o coletivo de lobos?",
          "alcateia",
          [
            "cardume",
            "manada",
            "matilha de aves"
          ]
        ],
        [
          "Qual figura de linguagem compara usando “como”?",
          "comparação",
          [
            "ironia",
            "personificação",
            "antítese"
          ]
        ],
        [
          "Qual figura de linguagem atribui características humanas a seres não humanos?",
          "personificação",
          [
            "hipérbole",
            "comparação",
            "ironia"
          ]
        ],
        [
          "Qual sinal separa itens de uma enumeração?",
          "vírgula",
          [
            "ponto de interrogação",
            "travessão",
            "ponto final"
          ]
        ],
        [
          "Qual sinal pode indicar fala de personagem?",
          "travessão",
          [
            "ponto de interrogação",
            "dois-pontos",
            "ponto e vírgula"
          ]
        ],
        [
          "Qual tipo de texto ensina a realizar uma tarefa?",
          "instrucional",
          [
            "poema",
            "notícia",
            "receita"
          ]
        ],
        [
          "Qual gênero apresenta fatos atuais?",
          "notícia",
          [
            "reportagem",
            "poema",
            "manual"
          ]
        ],
        [
          "Qual é o infinitivo de “cantou”?",
          "cantar",
          [
            "cantando",
            "cantado",
            "cantaria"
          ]
        ],
        [
          "Qual é o particípio de “escrever”?",
          "escrito",
          [
            "escrevendo",
            "escrever",
            "escrevia"
          ]
        ],
        [
          "Qual é o gerúndio de “fazer”?",
          "fazendo",
          [
            "feito",
            "fazer",
            "fazia"
          ]
        ],
        [
          "Qual palavra é oxítona?",
          "café",
          [
            "paroxítona",
            "proparoxítona",
            "monossílabo tônico"
          ]
        ],
        [
          "Qual palavra é paroxítona?",
          "mesa",
          [
            "proparoxítona",
            "paroxítona",
            "oxítona"
          ]
        ],
        [
          "Qual palavra é proparoxítona?",
          "pássaro",
          [
            "monossílabo tônico",
            "proparoxítona",
            "oxítona"
          ]
        ],
        [
          "Em “Não fui porque choveu”, “porque” indica o quê?",
          "causa",
          [
            "substantivo",
            "conjunção",
            "advérbio"
          ]
        ],
        [
          "Qual é a forma correta no plural: “mal” como substantivo?",
          "males",
          [
            "pronome",
            "preposição",
            "advérbio"
          ]
        ],
        [
          "Qual palavra tem sentido oposto a “generoso”?",
          "egoísta",
          [
            "reportagem",
            "conto",
            "manual"
          ]
        ],
        [
          "Qual palavra é derivada de “flor”?",
          "florista",
          [
            "substantivo",
            "conjunção",
            "pronome"
          ]
        ]
      ]
    },
    {
      "slug": "ciencias",
      "questions": [
        [
          "Qual planeta é conhecido como Planeta Vermelho?",
          "Marte",
          [
            "Saturno",
            "Terra",
            "Mercúrio"
          ]
        ],
        [
          "Qual gás respiramos para sobreviver?",
          "Oxigênio",
          [
            "Dióxido de carbono",
            "Elétron",
            "Na"
          ]
        ],
        [
          "A água ferve, ao nível do mar, a quantos graus Celsius?",
          "100 °C",
          [
            "Saturno",
            "Mercúrio",
            "Terra"
          ]
        ],
        [
          "Qual órgão bombeia o sangue?",
          "Coração",
          [
            "Pele",
            "Cérebro",
            "Estômago"
          ]
        ],
        [
          "Qual é a unidade básica da vida?",
          "Célula",
          [
            "Sangue",
            "Núcleo",
            "Leucócitos"
          ]
        ],
        [
          "Como se chama a passagem do líquido para o gasoso?",
          "Evaporação",
          [
            "Marte",
            "Mercúrio",
            "Netuno"
          ]
        ],
        [
          "Qual estrela ilumina a Terra?",
          "Sol",
          [
            "Terra",
            "Netuno",
            "Saturno"
          ]
        ],
        [
          "Quantos estados físicos clássicos da matéria são ensinados?",
          "3",
          [
            "Júpiter",
            "Urano",
            "Terra"
          ]
        ],
        [
          "Qual força nos mantém no solo?",
          "Gravidade",
          [
            "Vênus",
            "Urano",
            "Saturno"
          ]
        ],
        [
          "Qual vitamina é produzida com ajuda da luz solar?",
          "Vitamina D",
          [
            "Vitamina A",
            "Vitamina C",
            "Vitamina K"
          ]
        ],
        [
          "Qual é o maior planeta do Sistema Solar?",
          "Júpiter",
          [
            "Vênus",
            "Mercúrio",
            "Saturno"
          ]
        ],
        [
          "Qual planeta está mais próximo do Sol?",
          "Mercúrio",
          [
            "Saturno",
            "Terra",
            "Urano"
          ]
        ],
        [
          "Qual gás as plantas absorvem na fotossíntese?",
          "Dióxido de carbono",
          [
            "7",
            "Próton",
            "H₂O"
          ]
        ],
        [
          "Quais órgãos realizam principalmente as trocas gasosas na respiração humana?",
          "Pulmões",
          [
            "Rins",
            "Pele",
            "Estômago"
          ]
        ],
        [
          "Qual órgão filtra o sangue e produz urina?",
          "Rins",
          [
            "Pele",
            "Pulmões",
            "Fígado"
          ]
        ],
        [
          "Qual é o maior órgão do corpo humano?",
          "Pele",
          [
            "Estômago",
            "Pulmões",
            "Rins"
          ]
        ],
        [
          "Qual parte da planta absorve água do solo?",
          "Raiz",
          [
            "Saturno",
            "Netuno",
            "Júpiter"
          ]
        ],
        [
          "Qual pigmento dá cor verde às plantas?",
          "Clorofila",
          [
            "Marte",
            "Urano",
            "Vênus"
          ]
        ],
        [
          "Como se chama a passagem do gasoso para o líquido?",
          "Condensação",
          [
            "Terra",
            "Urano",
            "Saturno"
          ]
        ],
        [
          "Como se chama a passagem do sólido para o líquido?",
          "Fusão",
          [
            "Terra",
            "Mercúrio",
            "Netuno"
          ]
        ],
        [
          "Qual é a fórmula química da água?",
          "H₂O",
          [
            "7",
            "O",
            "Próton"
          ]
        ],
        [
          "Qual é o símbolo químico do oxigênio?",
          "O",
          [
            "Dióxido de carbono",
            "Oxigênio",
            "7"
          ]
        ],
        [
          "Qual é o símbolo químico do sódio?",
          "Na",
          [
            "Oxigênio",
            "H₂O",
            "Elétron"
          ]
        ],
        [
          "Qual partícula tem carga negativa?",
          "Elétron",
          [
            "O",
            "7",
            "Dióxido de carbono"
          ]
        ],
        [
          "Qual partícula tem carga positiva?",
          "Próton",
          [
            "Na",
            "7",
            "H₂O"
          ]
        ],
        [
          "Qual é o centro de um átomo?",
          "Núcleo",
          [
            "DNA",
            "Sangue",
            "Leucócitos"
          ]
        ],
        [
          "Que tipo de animal possui coluna vertebral?",
          "Vertebrado",
          [
            "Netuno",
            "Urano",
            "Mercúrio"
          ]
        ],
        [
          "Qual grupo de animais possui penas?",
          "Aves",
          [
            "Terra",
            "Vênus",
            "Saturno"
          ]
        ],
        [
          "Qual grupo de animais vive parte da vida na água e parte em terra?",
          "Anfíbios",
          [
            "Mercúrio",
            "Terra",
            "Marte"
          ]
        ],
        [
          "Qual é o processo de divisão celular para crescimento?",
          "Mitose",
          [
            "Sangue",
            "Núcleo",
            "Leucócitos"
          ]
        ],
        [
          "Qual molécula carrega informação genética?",
          "DNA",
          [
            "Núcleo",
            "Sangue",
            "Célula"
          ]
        ],
        [
          "Qual é a velocidade aproximada da luz no vácuo?",
          "300 mil km/s",
          [
            "30 mil km/s",
            "150 mil km/s",
            "600 mil km/s"
          ]
        ],
        [
          "Qual instrumento mede a temperatura?",
          "Termômetro",
          [
            "Barômetro",
            "Anemômetro",
            "Dinamômetro"
          ]
        ],
        [
          "Qual instrumento mede a pressão atmosférica?",
          "Barômetro",
          [
            "Dinamômetro",
            "Higrômetro",
            "Anemômetro"
          ]
        ],
        [
          "Qual unidade mede corrente elétrica?",
          "Ampère",
          [
            "Pascal",
            "Volt",
            "Joule"
          ]
        ],
        [
          "Qual unidade mede força?",
          "Newton",
          [
            "Volt",
            "Joule",
            "Pascal"
          ]
        ],
        [
          "Qual metal é líquido em temperatura ambiente?",
          "Mercúrio",
          [
            "Marte",
            "Júpiter",
            "Terra"
          ]
        ],
        [
          "Qual é o pH aproximado da água pura?",
          "7",
          [
            "5",
            "9",
            "12"
          ]
        ],
        [
          "Qual camada da Terra é a mais externa?",
          "Crosta",
          [
            "Netuno",
            "Marte",
            "Vênus"
          ]
        ],
        [
          "Qual fenômeno causa as marés principalmente?",
          "Gravidade da Lua",
          [
            "Saturno",
            "Marte",
            "Urano"
          ]
        ],
        [
          "Qual é a principal fonte de energia para a Terra?",
          "Sol",
          [
            "Saturno",
            "Terra",
            "Urano"
          ]
        ],
        [
          "Que tipo de energia está armazenada nos alimentos?",
          "Química",
          [
            "Biologia",
            "Geologia",
            "Física"
          ]
        ],
        [
          "Qual tecido transporta oxigênio no corpo?",
          "Sangue",
          [
            "Núcleo",
            "DNA",
            "Mitose"
          ]
        ],
        [
          "Qual componente do sangue combate infecções?",
          "Leucócitos",
          [
            "Sangue",
            "Célula",
            "Mitose"
          ]
        ],
        [
          "Qual vitamina está associada à coagulação sanguínea?",
          "Vitamina K",
          [
            "Vitamina D",
            "Vitamina B12",
            "Vitamina A"
          ]
        ],
        [
          "Qual doença é causada pela falta de insulina ou sua ação inadequada?",
          "Diabetes",
          [
            "Terra",
            "Vênus",
            "Marte"
          ]
        ],
        [
          "Qual microrganismo não possui estrutura celular completa?",
          "Vírus",
          [
            "Saturno",
            "Mercúrio",
            "Vênus"
          ]
        ],
        [
          "Qual reino inclui cogumelos?",
          "Fungi",
          [
            "Saturno",
            "Mercúrio",
            "Netuno"
          ]
        ],
        [
          "Qual ciência estuda os seres vivos?",
          "Biologia",
          [
            "Geologia",
            "Astronomia",
            "Ecologia"
          ]
        ],
        [
          "Qual ciência estuda os astros?",
          "Astronomia",
          [
            "Geologia",
            "Química",
            "Ecologia"
          ]
        ]
      ]
    },
    {
      "slug": "historia",
      "questions": [
        [
          "Em que ano o Brasil declarou a Independência?",
          "1822",
          [
            "1918",
            "1945",
            "1889"
          ]
        ],
        [
          "Quem proclamou a República no Brasil?",
          "Marechal Deodoro",
          [
            "Princesa Isabel",
            "Pedro Álvares Cabral",
            "Getúlio Vargas"
          ]
        ],
        [
          "Qual civilização construiu as pirâmides de Gizé?",
          "Egípcia",
          [
            "Maias",
            "Incas",
            "Grega"
          ]
        ],
        [
          "Em que continente surgiu a humanidade?",
          "África",
          [
            "1914",
            "1889",
            "1500"
          ]
        ],
        [
          "Qual evento começou em 1789?",
          "Revolução Francesa",
          [
            "Independência do Brasil",
            "Reforma Protestante",
            "Primeira Guerra Mundial"
          ]
        ],
        [
          "Quem foi o primeiro imperador do Brasil?",
          "Dom Pedro I",
          [
            "Getúlio Vargas",
            "George Washington",
            "Pedro Álvares Cabral"
          ]
        ],
        [
          "Qual povo criou a democracia em Atenas?",
          "Gregos",
          [
            "Romana",
            "Maias",
            "Sumérios"
          ]
        ],
        [
          "A Segunda Guerra Mundial terminou em qual ano?",
          "1945",
          [
            "1960",
            "1914",
            "1939"
          ]
        ],
        [
          "Qual documento aboliu a escravidão no Brasil?",
          "Lei Áurea",
          [
            "1960",
            "1889",
            "1822"
          ]
        ],
        [
          "Qual cidade romana foi soterrada pelo Vesúvio?",
          "Pompeia",
          [
            "Brasília",
            "Roma",
            "Salvador"
          ]
        ],
        [
          "Quem chegou ao Brasil em 1500 segundo a narrativa tradicional?",
          "Pedro Álvares Cabral",
          [
            "Martinho Lutero",
            "George Washington",
            "Alexandre, o Grande"
          ]
        ],
        [
          "Em que ano foi proclamada a República no Brasil?",
          "1889",
          [
            "1822",
            "1888",
            "1930"
          ]
        ],
        [
          "Quem assinou a Lei Áurea?",
          "Princesa Isabel",
          [
            "Alexandre, o Grande",
            "Carlos Magno",
            "Martinho Lutero"
          ]
        ],
        [
          "Qual movimento teve Tiradentes como participante?",
          "Inconfidência Mineira",
          [
            "Proclamação da República",
            "Revolução Francesa",
            "Primeira Guerra Mundial"
          ]
        ],
        [
          "Qual foi a primeira capital do Brasil?",
          "Salvador",
          [
            "Roma",
            "Pompeia",
            "Constantinopla"
          ]
        ],
        [
          "Quem governou o Brasil durante o Estado Novo?",
          "Getúlio Vargas",
          [
            "Alexandre, o Grande",
            "Pedro Álvares Cabral",
            "Napoleão Bonaparte"
          ]
        ],
        [
          "Em que ano Brasília foi inaugurada?",
          "1960",
          [
            "1950",
            "1956",
            "1964"
          ]
        ],
        [
          "Segundo a tradição romana, quem fundou a cidade de Roma?",
          "Rômulo",
          [
            "Napoleão Bonaparte",
            "Tiradentes",
            "Getúlio Vargas"
          ]
        ],
        [
          "Quem foi o primeiro presidente dos Estados Unidos?",
          "George Washington",
          [
            "Princesa Isabel",
            "Rômulo",
            "Pedro Álvares Cabral"
          ]
        ],
        [
          "Qual império teve Constantinopla como capital?",
          "Império Bizantino",
          [
            "Império Romano",
            "Império Carolíngio",
            "Império Otomano"
          ]
        ],
        [
          "Quem liderou a conquista macedônica até a Índia?",
          "Alexandre, o Grande",
          [
            "Martinho Lutero",
            "Getúlio Vargas",
            "Napoleão Bonaparte"
          ]
        ],
        [
          "Qual civilização desenvolveu a escrita cuneiforme?",
          "Sumérios",
          [
            "Maias",
            "Egípcia",
            "Romana"
          ]
        ],
        [
          "Qual povo antigo utilizava hieróglifos?",
          "Egípcios",
          [
            "Grega",
            "Incas",
            "Romana"
          ]
        ],
        [
          "Qual guerra ocorreu entre Atenas e Esparta?",
          "Guerra do Peloponeso",
          [
            "1492",
            "1945",
            "1889"
          ]
        ],
        [
          "Quem foi coroado imperador no ano 800?",
          "Carlos Magno",
          [
            "1888",
            "1822",
            "1500"
          ]
        ],
        [
          "Qual pandemia devastou a Europa no século XIV?",
          "Peste Negra",
          [
            "1945",
            "1789",
            "1914"
          ]
        ],
        [
          "Em que ano Cristóvão Colombo chegou à América?",
          "1492",
          [
            "1888",
            "1939",
            "1918"
          ]
        ],
        [
          "Qual tratado dividiu terras entre Portugal e Espanha em 1494?",
          "Tratado de Tordesilhas",
          [
            "1500",
            "1914",
            "1918"
          ]
        ],
        [
          "Quem iniciou a Reforma Protestante em 1517?",
          "Martinho Lutero",
          [
            "Princesa Isabel",
            "Napoleão Bonaparte",
            "Carlos Magno"
          ]
        ],
        [
          "Qual monarca francês ficou conhecido como Rei Sol?",
          "Luís XIV",
          [
            "1960",
            "1918",
            "1500"
          ]
        ],
        [
          "Qual evento marcou o início simbólico da Revolução Francesa?",
          "Queda da Bastilha",
          [
            "Inconfidência Mineira",
            "Proclamação da República",
            "Independência do Brasil"
          ]
        ],
        [
          "Quem foi derrotado em Waterloo?",
          "Napoleão Bonaparte",
          [
            "Pedro Álvares Cabral",
            "Getúlio Vargas",
            "Rômulo"
          ]
        ],
        [
          "Qual país iniciou a Revolução Industrial?",
          "Inglaterra",
          [
            "1789",
            "1914",
            "1960"
          ]
        ],
        [
          "Em que ano começou a Primeira Guerra Mundial?",
          "1914",
          [
            "1889",
            "1822",
            "1960"
          ]
        ],
        [
          "Qual fato desencadeou a Primeira Guerra Mundial?",
          "Assassinato do arquiduque Francisco Ferdinando",
          [
            "1888",
            "1500",
            "1789"
          ]
        ],
        [
          "Qual tratado encerrou oficialmente a Primeira Guerra Mundial?",
          "Tratado de Versalhes",
          [
            "1888",
            "1500",
            "1918"
          ]
        ],
        [
          "Em que ano começou a Segunda Guerra Mundial?",
          "1939",
          [
            "1889",
            "1822",
            "1914"
          ]
        ],
        [
          "Qual muro caiu em 1989?",
          "Muro de Berlim",
          [
            "1960",
            "1888",
            "1914"
          ]
        ],
        [
          "Qual conflito opôs Estados Unidos e União Soviética sem guerra direta total?",
          "Guerra Fria",
          [
            "1960",
            "1492",
            "1914"
          ]
        ],
        [
          "Quem foi o líder da independência da Índia associado à não violência?",
          "Mahatma Gandhi",
          [
            "George Washington",
            "Martinho Lutero",
            "Alexandre, o Grande"
          ]
        ],
        [
          "Qual revolução ocorreu na Rússia em 1917?",
          "Revolução Russa",
          [
            "1914",
            "1492",
            "1889"
          ]
        ],
        [
          "Qual civilização construiu Machu Picchu?",
          "Inca",
          [
            "Grega",
            "Astecas",
            "Maias"
          ]
        ],
        [
          "Qual civilização floresceu na península de Yucatán?",
          "Maia",
          [
            "Grega",
            "Sumérios",
            "Fenícios"
          ]
        ],
        [
          "Qual líder sul-africano combateu o apartheid e tornou-se presidente?",
          "Nelson Mandela",
          [
            "1888",
            "1960",
            "1789"
          ]
        ],
        [
          "Qual período brasileiro sucedeu a abdicação de Dom Pedro I?",
          "Período Regencial",
          [
            "1939",
            "1889",
            "1918"
          ]
        ],
        [
          "Qual guerra envolveu Brasil, Argentina e Uruguai contra o Paraguai?",
          "Guerra do Paraguai",
          [
            "1889",
            "1888",
            "1918"
          ]
        ],
        [
          "Qual revolta ocorreu na Bahia entre 1835 e envolveu africanos muçulmanos?",
          "Revolta dos Malês",
          [
            "1918",
            "1914",
            "1789"
          ]
        ],
        [
          "Qual movimento encerrou a monarquia brasileira?",
          "Proclamação da República",
          [
            "Segunda Guerra Mundial",
            "Revolução Francesa",
            "Primeira Guerra Mundial"
          ]
        ],
        [
          "Qual constituição brasileira foi promulgada em 1988?",
          "Constituição Cidadã",
          [
            "1945",
            "1789",
            "1492"
          ]
        ],
        [
          "Qual povo navegante fundou colônias comerciais no Mediterrâneo?",
          "Fenícios",
          [
            "Grega",
            "Romana",
            "Maias"
          ]
        ]
      ]
    },
    {
      "slug": "geografia",
      "questions": [
        [
          "Qual é o maior país do mundo em área?",
          "Rússia",
          [
            "Austrália",
            "China",
            "França"
          ]
        ],
        [
          "Qual é a capital do Brasil?",
          "Brasília",
          [
            "Lisboa",
            "Lima",
            "Moscou"
          ]
        ],
        [
          "Qual oceano banha a costa leste brasileira?",
          "Atlântico",
          [
            "Índico",
            "Ártico",
            "Pacífico"
          ]
        ],
        [
          "Em qual continente fica o Egito?",
          "África",
          [
            "Ásia",
            "América",
            "Antártida"
          ]
        ],
        [
          "Qual é o rio de maior volume de água do mundo?",
          "Amazonas",
          [
            "Mississippi",
            "Yangtzé",
            "Ganges"
          ]
        ],
        [
          "Qual é a capital da Argentina?",
          "Buenos Aires",
          [
            "Pequim",
            "Cidade do México",
            "Moscou"
          ]
        ],
        [
          "Qual linha imaginária divide a Terra em hemisférios Norte e Sul?",
          "Equador",
          [
            "Yangtzé",
            "Amazonas",
            "Mississippi"
          ]
        ],
        [
          "Qual é o menor continente em área?",
          "Oceania",
          [
            "Ásia",
            "Antártida",
            "Europa"
          ]
        ],
        [
          "Em qual região brasileira fica o estado do Pará?",
          "Norte",
          [
            "Moscou",
            "Paris",
            "Pequim"
          ]
        ],
        [
          "Qual é o ponto mais alto da Terra?",
          "Monte Everest",
          [
            "Canberra",
            "Ottawa",
            "Pequim"
          ]
        ],
        [
          "Qual é a capital da França?",
          "Paris",
          [
            "Cairo",
            "Buenos Aires",
            "Roma"
          ]
        ],
        [
          "Qual é a capital de Portugal?",
          "Lisboa",
          [
            "Moscou",
            "Canberra",
            "Berlim"
          ]
        ],
        [
          "Qual é a capital da Espanha?",
          "Madri",
          [
            "Tóquio",
            "Ottawa",
            "Nova Délhi"
          ]
        ],
        [
          "Qual é a capital da Itália?",
          "Roma",
          [
            "Berlim",
            "Lima",
            "Madri"
          ]
        ],
        [
          "Qual é a capital da Alemanha?",
          "Berlim",
          [
            "Tóquio",
            "Lima",
            "Lisboa"
          ]
        ],
        [
          "Qual é a capital do Reino Unido?",
          "Londres",
          [
            "Moscou",
            "Paris",
            "Tóquio"
          ]
        ],
        [
          "Qual é a capital do Japão?",
          "Tóquio",
          [
            "Lisboa",
            "Cairo",
            "Moscou"
          ]
        ],
        [
          "Qual é a capital da China?",
          "Pequim",
          [
            "Moscou",
            "Londres",
            "Paris"
          ]
        ],
        [
          "Qual é a capital do Canadá?",
          "Ottawa",
          [
            "Atenas",
            "Santiago",
            "Londres"
          ]
        ],
        [
          "Qual é a capital do México?",
          "Cidade do México",
          [
            "Nova Délhi",
            "Roma",
            "Lisboa"
          ]
        ],
        [
          "Qual é a capital do Chile?",
          "Santiago",
          [
            "Lima",
            "Nova Délhi",
            "Ottawa"
          ]
        ],
        [
          "Qual é a capital do Peru?",
          "Lima",
          [
            "Canberra",
            "Atenas",
            "Moscou"
          ]
        ],
        [
          "Qual é a capital do Uruguai?",
          "Montevidéu",
          [
            "Moscou",
            "Pequim",
            "Londres"
          ]
        ],
        [
          "Qual é a capital da Colômbia?",
          "Bogotá",
          [
            "Cairo",
            "Roma",
            "Cidade do México"
          ]
        ],
        [
          "Qual é a capital da Austrália?",
          "Canberra",
          [
            "Ottawa",
            "Atenas",
            "Berlim"
          ]
        ],
        [
          "Qual é a capital da Índia?",
          "Nova Délhi",
          [
            "Atenas",
            "Lima",
            "Santiago"
          ]
        ],
        [
          "Qual é a capital da Rússia?",
          "Moscou",
          [
            "Canberra",
            "Atenas",
            "Buenos Aires"
          ]
        ],
        [
          "Qual é a capital da Grécia?",
          "Atenas",
          [
            "Canberra",
            "Berlim",
            "Pequim"
          ]
        ],
        [
          "Qual é a capital do Egito?",
          "Cairo",
          [
            "Londres",
            "Lisboa",
            "Atenas"
          ]
        ],
        [
          "Qual é a capital da África do Sul administrativa?",
          "Pretória",
          [
            "Atenas",
            "Ottawa",
            "Madri"
          ]
        ],
        [
          "Qual é o maior oceano da Terra?",
          "Pacífico",
          [
            "Índico",
            "Antártico",
            "Atlântico"
          ]
        ],
        [
          "Qual é o maior deserto quente do mundo?",
          "Saara",
          [
            "Gobi",
            "Kalahari",
            "Patagônia"
          ]
        ],
        [
          "Qual cordilheira atravessa a costa oeste da América do Sul?",
          "Andes",
          [
            "Montanhas Rochosas",
            "Alpes",
            "Atlas"
          ]
        ],
        [
          "Qual rio atravessa o Egito?",
          "Nilo",
          [
            "Mississippi",
            "Ganges",
            "Danúbio"
          ]
        ],
        [
          "Qual país é conhecido como Terra do Sol Nascente?",
          "Japão",
          [
            "Espanha",
            "Alemanha",
            "França"
          ]
        ],
        [
          "Qual continente tem maior área?",
          "Ásia",
          [
            "África",
            "América",
            "Antártida"
          ]
        ],
        [
          "Qual continente é coberto quase totalmente por gelo?",
          "Antártida",
          [
            "Ásia",
            "América",
            "África"
          ]
        ],
        [
          "Qual linha marca 0° de longitude?",
          "Meridiano de Greenwich",
          [
            "Berlim",
            "Cairo",
            "Londres"
          ]
        ],
        [
          "Qual trópico atravessa parte do Brasil?",
          "Trópico de Capricórnio",
          [
            "Buenos Aires",
            "Berlim",
            "Pequim"
          ]
        ],
        [
          "Qual é o maior estado brasileiro em área?",
          "Amazonas",
          [
            "Ganges",
            "Yangtzé",
            "Nilo"
          ]
        ],
        [
          "Qual é o menor estado brasileiro em área?",
          "Sergipe",
          [
            "Atenas",
            "Tóquio",
            "Ottawa"
          ]
        ],
        [
          "Qual região brasileira possui mais estados?",
          "Nordeste",
          [
            "Atenas",
            "Canberra",
            "Lima"
          ]
        ],
        [
          "Qual bioma predomina no Centro-Oeste brasileiro?",
          "Cerrado",
          [
            "Madri",
            "Atenas",
            "Berlim"
          ]
        ],
        [
          "Qual é a capital do Pará?",
          "Belém",
          [
            "Buenos Aires",
            "Lima",
            "Atenas"
          ]
        ],
        [
          "Qual é a capital do Amazonas?",
          "Manaus",
          [
            "Atenas",
            "Nova Délhi",
            "Pequim"
          ]
        ],
        [
          "Qual é a capital de Pernambuco?",
          "Recife",
          [
            "Lima",
            "Moscou",
            "Paris"
          ]
        ],
        [
          "Qual é a capital da Bahia?",
          "Salvador",
          [
            "Madri",
            "Lima",
            "Roma"
          ]
        ],
        [
          "Qual país faz fronteira com o Brasil ao norte e tem Caracas como capital?",
          "Venezuela",
          [
            "Madri",
            "Cidade do México",
            "Lisboa"
          ]
        ],
        [
          "Qual estreito separa Europa e África?",
          "Estreito de Gibraltar",
          [
            "Cairo",
            "Madri",
            "Atenas"
          ]
        ],
        [
          "Qual mar fica entre Europa, África e Ásia?",
          "Mar Mediterrâneo",
          [
            "Nova Délhi",
            "Santiago",
            "Lima"
          ]
        ]
      ]
    },
    {
      "slug": "ingles",
      "questions": [
        [
          "Como se diz 'livro' em inglês?",
          "book",
          [
            "night",
            "quickly",
            "family"
          ]
        ],
        [
          "Qual é o passado de 'go'?",
          "went",
          [
            "wrote",
            "made",
            "bought"
          ]
        ],
        [
          "O que significa 'good morning'?",
          "bom dia",
          [
            "tomorrow",
            "water",
            "school"
          ]
        ],
        [
          "Qual pronome significa 'nós'?",
          "we",
          [
            "city",
            "house",
            "yesterday"
          ]
        ],
        [
          "Qual é o plural de 'child'?",
          "children",
          [
            "feet",
            "men",
            "teeth"
          ]
        ],
        [
          "Como se diz 'vermelho' em inglês?",
          "red",
          [
            "friend",
            "day",
            "water"
          ]
        ],
        [
          "Complete: She ___ a teacher.",
          "is",
          [
            "was",
            "made",
            "were"
          ]
        ],
        [
          "O que significa 'always'?",
          "sempre",
          [
            "country",
            "city",
            "yesterday"
          ]
        ],
        [
          "Qual palavra é um animal?",
          "horse",
          [
            "tomorrow",
            "friend",
            "yesterday"
          ]
        ],
        [
          "Como se diz 'obrigado' em inglês?",
          "thank you",
          [
            "tomorrow",
            "family",
            "book"
          ]
        ],
        [
          "Como se diz 'casa' em inglês?",
          "house",
          [
            "family",
            "car",
            "water"
          ]
        ],
        [
          "Como se diz 'água' em inglês?",
          "water",
          [
            "family",
            "food",
            "car"
          ]
        ],
        [
          "Como se diz 'comida' em inglês?",
          "food",
          [
            "book",
            "country",
            "friend"
          ]
        ],
        [
          "Como se diz 'amigo' em inglês?",
          "friend",
          [
            "school",
            "house",
            "quickly"
          ]
        ],
        [
          "Como se diz 'família' em inglês?",
          "family",
          [
            "city",
            "window",
            "country"
          ]
        ],
        [
          "Como se diz 'escola' em inglês?",
          "school",
          [
            "day",
            "city",
            "quickly"
          ]
        ],
        [
          "Como se diz 'cidade' em inglês?",
          "city",
          [
            "day",
            "water",
            "night"
          ]
        ],
        [
          "Como se diz 'carro' em inglês?",
          "car",
          [
            "night",
            "yesterday",
            "quickly"
          ]
        ],
        [
          "Como se diz 'janela' em inglês?",
          "window",
          [
            "night",
            "door",
            "friend"
          ]
        ],
        [
          "Como se diz 'porta' em inglês?",
          "door",
          [
            "city",
            "book",
            "yesterday"
          ]
        ],
        [
          "O que significa 'yesterday'?",
          "ontem",
          [
            "door",
            "house",
            "difficult"
          ]
        ],
        [
          "O que significa 'tomorrow'?",
          "amanhã",
          [
            "difficult",
            "book",
            "night"
          ]
        ],
        [
          "O que significa 'never'?",
          "nunca",
          [
            "car",
            "door",
            "window"
          ]
        ],
        [
          "O que significa 'sometimes'?",
          "às vezes",
          [
            "quickly",
            "night",
            "school"
          ]
        ],
        [
          "O que significa 'beautiful'?",
          "bonito",
          [
            "school",
            "difficult",
            "food"
          ]
        ],
        [
          "O que significa 'difficult'?",
          "difícil",
          [
            "country",
            "car",
            "book"
          ]
        ],
        [
          "O que significa 'quickly'?",
          "rapidamente",
          [
            "family",
            "city",
            "window"
          ]
        ],
        [
          "O que significa 'because'?",
          "porque",
          [
            "car",
            "food",
            "window"
          ]
        ],
        [
          "Qual é o passado de 'eat'?",
          "ate",
          [
            "saw",
            "went",
            "am"
          ]
        ],
        [
          "Qual é o passado de 'see'?",
          "saw",
          [
            "is",
            "are",
            "bought"
          ]
        ],
        [
          "Qual é o passado de 'write'?",
          "wrote",
          [
            "am",
            "was",
            "were"
          ]
        ],
        [
          "Qual é o passado de 'buy'?",
          "bought",
          [
            "saw",
            "ate",
            "were"
          ]
        ],
        [
          "Qual é o plural de 'mouse'?",
          "mice",
          [
            "people",
            "feet",
            "men"
          ]
        ],
        [
          "Qual é o plural de 'tooth'?",
          "teeth",
          [
            "men",
            "mice",
            "people"
          ]
        ],
        [
          "Qual é o plural de 'foot'?",
          "feet",
          [
            "teeth",
            "people",
            "mice"
          ]
        ],
        [
          "Complete: I ___ happy.",
          "am",
          [
            "were",
            "ate",
            "went"
          ]
        ],
        [
          "Complete: They ___ students.",
          "are",
          [
            "went",
            "saw",
            "made"
          ]
        ],
        [
          "Complete: He ___ soccer every Sunday.",
          "plays",
          [
            "quickly",
            "school",
            "door"
          ]
        ],
        [
          "Complete: We ___ to school yesterday.",
          "went",
          [
            "was",
            "wrote",
            "made"
          ]
        ],
        [
          "Qual pronome significa 'eles' ou 'elas'?",
          "they",
          [
            "book",
            "quickly",
            "house"
          ]
        ],
        [
          "Qual pronome possessivo significa 'meu/minha'?",
          "my",
          [
            "yesterday",
            "difficult",
            "country"
          ]
        ],
        [
          "Qual palavra significa 'onde'?",
          "where",
          [
            "house",
            "night",
            "book"
          ]
        ],
        [
          "Qual palavra significa 'quando'?",
          "when",
          [
            "country",
            "food",
            "city"
          ]
        ],
        [
          "Qual palavra significa 'quem'?",
          "who",
          [
            "friend",
            "door",
            "tomorrow"
          ]
        ],
        [
          "Como se diz 'boa noite' ao se despedir?",
          "good night",
          [
            "food",
            "house",
            "window"
          ]
        ],
        [
          "Como se diz 'por favor' em inglês?",
          "please",
          [
            "tomorrow",
            "door",
            "family"
          ]
        ],
        [
          "Como se diz 'desculpe' em inglês?",
          "sorry",
          [
            "city",
            "food",
            "water"
          ]
        ],
        [
          "Qual é o comparativo de 'good'?",
          "better",
          [
            "car",
            "door",
            "country"
          ]
        ],
        [
          "Qual é o superlativo de 'good'?",
          "best",
          [
            "happy",
            "day",
            "book"
          ]
        ],
        [
          "Qual modal expressa habilidade?",
          "can",
          [
            "house",
            "school",
            "friend"
          ]
        ]
      ]
    },
    {
      "slug": "tecnologia",
      "questions": [
        [
          "O que significa CPU?",
          "Unidade Central de Processamento",
          [
            "Mouse",
            "RAM",
            "CPU"
          ]
        ],
        [
          "Qual protocolo é usado para páginas web seguras?",
          "HTTPS",
          [
            "URL",
            "DNS",
            "JavaScript"
          ]
        ],
        [
          "Qual linguagem estrutura páginas web?",
          "HTML",
          [
            "HTTP",
            "CSS",
            "DNS"
          ]
        ],
        [
          "O que é armazenamento em nuvem?",
          "Dados em servidores remotos",
          [
            "SSD",
            "GPU",
            "Monitor"
          ]
        ],
        [
          "Qual componente guarda dados temporários em uso?",
          "RAM",
          [
            "Impressora",
            "CPU",
            "SSD"
          ]
        ],
        [
          "O que é phishing?",
          "Tentativa de roubar dados",
          [
            "SSD",
            "Mouse",
            "Placa-mãe"
          ]
        ],
        [
          "Qual destes é um sistema operacional?",
          "Linux",
          [
            "SQL",
            "Sistema operacional",
            "Código aberto"
          ]
        ],
        [
          "Para que serve um firewall?",
          "Controlar tráfego de rede",
          [
            "SSD",
            "Impressora",
            "Teclado"
          ]
        ],
        [
          "O que significa URL?",
          "Localizador Uniforme de Recursos",
          [
            "Teclado",
            "Impressora",
            "SSD"
          ]
        ],
        [
          "Qual é uma boa prática de senha?",
          "Usar frase longa e única",
          [
            "SSD",
            "Placa-mãe",
            "RAM"
          ]
        ],
        [
          "O que significa SSD?",
          "Unidade de Estado Sólido",
          [
            "Mouse",
            "Roteador",
            "GPU"
          ]
        ],
        [
          "Qual componente executa cálculos gráficos?",
          "GPU",
          [
            "SSD",
            "RAM",
            "Placa-mãe"
          ]
        ],
        [
          "Qual dispositivo aponta e seleciona itens na tela?",
          "Mouse",
          [
            "RAM",
            "Teclado",
            "HD"
          ]
        ],
        [
          "Qual dispositivo exibe imagens do computador?",
          "Monitor",
          [
            "RAM",
            "CPU",
            "GPU"
          ]
        ],
        [
          "Qual dispositivo imprime documentos em papel?",
          "Impressora",
          [
            "Roteador",
            "Teclado",
            "GPU"
          ]
        ],
        [
          "Qual rede conecta dispositivos sem fio em curta distância?",
          "Wi-Fi",
          [
            "Impressora",
            "Placa-mãe",
            "Teclado"
          ]
        ],
        [
          "Qual tecnologia conecta acessórios sem fio próximos?",
          "Bluetooth",
          [
            "Endereço IP",
            "Latência",
            "Wi-Fi"
          ]
        ],
        [
          "O que é um navegador de internet?",
          "Programa para acessar páginas web",
          [
            "Teclado",
            "Placa-mãe",
            "HD"
          ]
        ],
        [
          "Qual linguagem estiliza páginas web?",
          "CSS",
          [
            "HTTPS",
            "HTML",
            "HTTP"
          ]
        ],
        [
          "Qual linguagem é muito usada para interatividade na web?",
          "JavaScript",
          [
            "HTTPS",
            "URL",
            "HTML"
          ]
        ],
        [
          "Qual linguagem é usada para consultar bancos relacionais?",
          "SQL",
          [
            "Driver",
            "Código aberto",
            "Banco de dados"
          ]
        ],
        [
          "O que é um banco de dados?",
          "Sistema organizado de armazenamento de informações",
          [
            "SQL",
            "Banco de dados",
            "Sistema operacional"
          ]
        ],
        [
          "O que significa backup?",
          "Cópia de segurança",
          [
            "Mouse",
            "Impressora",
            "HD"
          ]
        ],
        [
          "O que é malware?",
          "Programa malicioso",
          [
            "Firewall",
            "Antivírus",
            "Autenticação de dois fatores"
          ]
        ],
        [
          "O que é ransomware?",
          "Malware que bloqueia dados e exige pagamento",
          [
            "SSD",
            "Monitor",
            "Roteador"
          ]
        ],
        [
          "O que é autenticação de dois fatores?",
          "Verificação com dois métodos",
          [
            "Monitor",
            "GPU",
            "Teclado"
          ]
        ],
        [
          "O que é criptografia?",
          "Proteção de dados por codificação",
          [
            "HD",
            "Placa-mãe",
            "GPU"
          ]
        ],
        [
          "Qual protocolo envia e-mails?",
          "SMTP",
          [
            "Endereço IP",
            "Largura de banda",
            "Latência"
          ]
        ],
        [
          "Qual protocolo traduz nomes de domínio em endereços IP?",
          "DNS",
          [
            "JavaScript",
            "HTTP",
            "HTTPS"
          ]
        ],
        [
          "O que é um endereço IP?",
          "Identificador de um dispositivo na rede",
          [
            "Roteador",
            "Teclado",
            "Impressora"
          ]
        ],
        [
          "O que é um roteador?",
          "Dispositivo que encaminha tráfego de rede",
          [
            "GPU",
            "CPU",
            "Impressora"
          ]
        ],
        [
          "O que é latência?",
          "Tempo de resposta de uma conexão",
          [
            "Mouse",
            "CPU",
            "RAM"
          ]
        ],
        [
          "O que é largura de banda?",
          "Capacidade de transmissão de dados",
          [
            "Roteador",
            "Impressora",
            "HD"
          ]
        ],
        [
          "O que é código aberto?",
          "Software com código-fonte acessível",
          [
            "CPU",
            "Teclado",
            "GPU"
          ]
        ],
        [
          "O que é um aplicativo?",
          "Programa criado para uma função",
          [
            "Mouse",
            "HD",
            "Placa-mãe"
          ]
        ],
        [
          "O que é um sistema operacional?",
          "Software que gerencia o hardware e programas",
          [
            "Sistema operacional",
            "Banco de dados",
            "SQL"
          ]
        ],
        [
          "Qual empresa desenvolve o Android?",
          "Google",
          [
            "Placa-mãe",
            "HD",
            "GPU"
          ]
        ],
        [
          "Qual empresa desenvolve o Windows?",
          "Microsoft",
          [
            "Teclado",
            "Mouse",
            "HD"
          ]
        ],
        [
          "Qual sistema operacional equipa os iPhones?",
          "iOS",
          [
            "Aplicativo",
            "Driver",
            "Banco de dados"
          ]
        ],
        [
          "Qual extensão costuma indicar uma imagem JPEG?",
          ".jpg",
          [
            "HD",
            "RAM",
            "Impressora"
          ]
        ],
        [
          "Qual extensão costuma indicar um documento PDF?",
          ".pdf",
          [
            "Mouse",
            "Impressora",
            "Roteador"
          ]
        ],
        [
          "Qual tecla costuma atualizar uma página no navegador?",
          "F5",
          [
            "Navegador",
            "URL",
            "CSS"
          ]
        ],
        [
          "Qual atalho copia um conteúdo no Windows?",
          "Ctrl+C",
          [
            "GPU",
            "Roteador",
            "Teclado"
          ]
        ],
        [
          "Qual atalho cola um conteúdo no Windows?",
          "Ctrl+V",
          [
            "Mouse",
            "GPU",
            "Monitor"
          ]
        ],
        [
          "Qual atalho desfaz a última ação no Windows?",
          "Ctrl+Z",
          [
            "Teclado",
            "CPU",
            "Monitor"
          ]
        ],
        [
          "O que é inteligência artificial?",
          "Sistemas capazes de realizar tarefas associadas à inteligência humana",
          [
            "SSD",
            "Teclado",
            "Monitor"
          ]
        ],
        [
          "O que é aprendizado de máquina?",
          "Método em que sistemas aprendem padrões com dados",
          [
            "Placa-mãe",
            "CPU",
            "Teclado"
          ]
        ],
        [
          "O que é computação em nuvem?",
          "Uso de recursos computacionais pela internet",
          [
            "Placa-mãe",
            "SSD",
            "RAM"
          ]
        ],
        [
          "O que é API?",
          "Interface para comunicação entre sistemas",
          [
            "Roteador",
            "GPU",
            "SSD"
          ]
        ],
        [
          "O que é Git?",
          "Sistema de controle de versões",
          [
            "GPU",
            "Roteador",
            "Impressora"
          ]
        ]
      ]
    },
    {
      "slug": "artes",
      "questions": [
        [
          "Quem pintou a Mona Lisa?",
          "Leonardo da Vinci",
          [
            "Claude Monet",
            "Salvador Dalí",
            "Candido Portinari"
          ]
        ],
        [
          "Quais são as cores primárias tradicionais na pintura?",
          "Vermelho, azul e amarelo",
          [
            "Roxo",
            "Laranja",
            "Amarelo"
          ]
        ],
        [
          "Qual movimento é associado a Claude Monet?",
          "Impressionismo",
          [
            "Expressionismo",
            "Cubismo",
            "Modernismo"
          ]
        ],
        [
          "Como se chama uma obra feita com pequenos pedaços unidos?",
          "Mosaico",
          [
            "Gravura",
            "Óleo sobre tela",
            "Aquarela"
          ]
        ],
        [
          "Qual artista pintou 'Noite Estrelada'?",
          "Vincent van Gogh",
          [
            "Pablo Picasso",
            "Claude Monet",
            "Candido Portinari"
          ]
        ],
        [
          "O que é uma escultura?",
          "Arte em três dimensões",
          [
            "Leonardo da Vinci",
            "Pablo Picasso",
            "Tarsila do Amaral"
          ]
        ],
        [
          "Qual movimento usa formas geométricas fragmentadas?",
          "Cubismo",
          [
            "Impressionismo",
            "Expressionismo",
            "Barroco"
          ]
        ],
        [
          "Quem pintou 'Abaporu'?",
          "Tarsila do Amaral",
          [
            "Frida Kahlo",
            "Leonardo da Vinci",
            "Pablo Picasso"
          ]
        ],
        [
          "Qual material é comum na aquarela?",
          "Pigmento diluído em água",
          [
            "Claude Monet",
            "Michelangelo",
            "Frida Kahlo"
          ]
        ],
        [
          "Como se chama a arte de dobrar papel?",
          "Origami",
          [
            "Aquarela",
            "Escultura",
            "Gravura"
          ]
        ],
        [
          "Quem pintou “A Noite Estrelada”?",
          "Vincent van Gogh",
          [
            "Claude Monet",
            "Candido Portinari",
            "Leonardo da Vinci"
          ]
        ],
        [
          "Quem pintou “Guernica”?",
          "Pablo Picasso",
          [
            "Claude Monet",
            "Candido Portinari",
            "Vincent van Gogh"
          ]
        ],
        [
          "Quem esculpiu “Davi” no Renascimento?",
          "Michelangelo",
          [
            "Candido Portinari",
            "Claude Monet",
            "Pablo Picasso"
          ]
        ],
        [
          "Quem pintou o teto da Capela Sistina?",
          "Michelangelo",
          [
            "Vincent van Gogh",
            "Frida Kahlo",
            "Salvador Dalí"
          ]
        ],
        [
          "Qual artista brasileira pintou “Abaporu”?",
          "Tarsila do Amaral",
          [
            "Salvador Dalí",
            "Pablo Picasso",
            "Leonardo da Vinci"
          ]
        ],
        [
          "Qual movimento artístico valorizou formas geométricas fragmentadas?",
          "Cubismo",
          [
            "Modernismo",
            "Renascimento",
            "Surrealismo"
          ]
        ],
        [
          "Qual movimento valorizou sonhos e o inconsciente?",
          "Surrealismo",
          [
            "Renascimento",
            "Cubismo",
            "Barroco"
          ]
        ],
        [
          "Qual estilo artístico europeu precedeu o Barroco?",
          "Renascimento",
          [
            "Expressionismo",
            "Impressionismo",
            "Surrealismo"
          ]
        ],
        [
          "Qual estilo brasileiro é associado a Aleijadinho?",
          "Barroco",
          [
            "Renascimento",
            "Cubismo",
            "Surrealismo"
          ]
        ],
        [
          "O que é um autorretrato?",
          "Representação do próprio artista",
          [
            "Tarsila do Amaral",
            "Salvador Dalí",
            "Vincent van Gogh"
          ]
        ],
        [
          "O que é uma natureza-morta?",
          "Representação de objetos inanimados",
          [
            "Michelangelo",
            "Candido Portinari",
            "Frida Kahlo"
          ]
        ],
        [
          "Qual técnica usa tinta diluída em água sobre papel?",
          "Aquarela",
          [
            "Gravura",
            "Mosaico",
            "Escultura"
          ]
        ],
        [
          "Qual técnica aplica pigmento em parede úmida?",
          "Afresco",
          [
            "Escultura",
            "Origami",
            "Óleo sobre tela"
          ]
        ],
        [
          "Qual material é moldado e queimado para produzir cerâmica?",
          "Argila",
          [
            "Michelangelo",
            "Leonardo da Vinci",
            "Claude Monet"
          ]
        ],
        [
          "Como se chama a arte de gravar imagens em uma matriz para impressão?",
          "Gravura",
          [
            "Escultura",
            "Aquarela",
            "Origami"
          ]
        ],
        [
          "Qual elemento visual indica claro e escuro?",
          "Valor tonal",
          [
            "Ritmo",
            "Textura",
            "Forma"
          ]
        ],
        [
          "Qual elemento visual define contornos e trajetórias?",
          "Linha",
          [
            "Ritmo",
            "Forma",
            "Cor"
          ]
        ],
        [
          "Qual elemento visual ocupa uma superfície delimitada?",
          "Forma",
          [
            "Valor tonal",
            "Cor",
            "Textura"
          ]
        ],
        [
          "Qual princípio cria sensação de estabilidade visual?",
          "Equilíbrio",
          [
            "Michelangelo",
            "Frida Kahlo",
            "Vincent van Gogh"
          ]
        ],
        [
          "Qual princípio destaca um elemento principal?",
          "Ênfase",
          [
            "Valor tonal",
            "Cor",
            "Textura"
          ]
        ],
        [
          "Qual princípio repete elementos para sugerir movimento?",
          "Ritmo",
          [
            "Barroco",
            "Cubismo",
            "Renascimento"
          ]
        ],
        [
          "Qual cor é complementar ao vermelho no círculo cromático tradicional?",
          "Verde",
          [
            "Vermelho",
            "Roxo",
            "Azul"
          ]
        ],
        [
          "Qual cor é complementar ao azul?",
          "Laranja",
          [
            "Roxo",
            "Verde",
            "Amarelo"
          ]
        ],
        [
          "Qual cor é complementar ao amarelo?",
          "Roxo",
          [
            "Amarelo",
            "Laranja",
            "Vermelho"
          ]
        ],
        [
          "Quem é conhecido por pintar relógios derretidos?",
          "Salvador Dalí",
          [
            "Tarsila do Amaral",
            "Leonardo da Vinci",
            "Candido Portinari"
          ]
        ],
        [
          "Quem criou esculturas móveis chamadas móbiles?",
          "Alexander Calder",
          [
            "Pablo Picasso",
            "Leonardo da Vinci",
            "Salvador Dalí"
          ]
        ],
        [
          "Qual artista é associado à Pop Art e às latas de sopa Campbell?",
          "Andy Warhol",
          [
            "Vincent van Gogh",
            "Frida Kahlo",
            "Pablo Picasso"
          ]
        ],
        [
          "Qual artista mexicana é conhecida por seus autorretratos?",
          "Frida Kahlo",
          [
            "Pablo Picasso",
            "Candido Portinari",
            "Vincent van Gogh"
          ]
        ],
        [
          "Qual arquiteto projetou a Catedral de Brasília?",
          "Oscar Niemeyer",
          [
            "Tarsila do Amaral",
            "Leonardo da Vinci",
            "Michelangelo"
          ]
        ],
        [
          "Qual arte utiliza movimentos corporais como linguagem?",
          "Dança",
          [
            "Impressionismo",
            "Renascimento",
            "Modernismo"
          ]
        ],
        [
          "Qual arte combina atuação, cenário e dramaturgia?",
          "Teatro",
          [
            "Pablo Picasso",
            "Frida Kahlo",
            "Leonardo da Vinci"
          ]
        ],
        [
          "Como se chama o profissional que cria coreografias?",
          "Coreógrafo",
          [
            "Amarelo",
            "Laranja",
            "Verde"
          ]
        ],
        [
          "Como se chama a organização de elementos numa obra visual?",
          "Composição",
          [
            "Textura",
            "Forma",
            "Valor tonal"
          ]
        ],
        [
          "Qual técnica cria imagens colando materiais diversos?",
          "Colagem",
          [
            "Origami",
            "Aquarela",
            "Escultura"
          ]
        ],
        [
          "Qual técnica usa pequenos pontos de cor?",
          "Pontilhismo",
          [
            "Escultura",
            "Origami",
            "Mosaico"
          ]
        ],
        [
          "Quem foi um dos principais nomes do Pontilhismo?",
          "Georges Seurat",
          [
            "Claude Monet",
            "Leonardo da Vinci",
            "Michelangelo"
          ]
        ],
        [
          "Qual museu de Paris abriga a Mona Lisa?",
          "Louvre",
          [
            "Salvador Dalí",
            "Claude Monet",
            "Tarsila do Amaral"
          ]
        ],
        [
          "Como se chama uma exposição de obras de arte?",
          "Mostra",
          [
            "Salvador Dalí",
            "Claude Monet",
            "Leonardo da Vinci"
          ]
        ],
        [
          "Qual arte urbana usa tinta em muros e paredes?",
          "Grafite",
          [
            "Michelangelo",
            "Pablo Picasso",
            "Claude Monet"
          ]
        ],
        [
          "Como se chama a arte de produzir imagens por meio da luz?",
          "Fotografia",
          [
            "Candido Portinari",
            "Pablo Picasso",
            "Claude Monet"
          ]
        ]
      ]
    },
    {
      "slug": "musica",
      "questions": [
        [
          "Quantas notas há na escala musical básica?",
          "7",
          [
            "Si",
            "Sol",
            "Ré"
          ]
        ],
        [
          "Qual instrumento tem teclas brancas e pretas?",
          "Piano",
          [
            "Clarinete",
            "Violino",
            "Tambor"
          ]
        ],
        [
          "Qual clave é comum para sons agudos?",
          "Clave de sol",
          [
            "Bemol",
            "Bequadro",
            "Pausa"
          ]
        ],
        [
          "Quem compôs a Nona Sinfonia?",
          "Beethoven",
          [
            "Violão",
            "Violino",
            "Clarinete"
          ]
        ],
        [
          "Qual instrumento pertence à família das cordas?",
          "Violoncelo",
          [
            "Clarinete",
            "Trompete",
            "Tambor"
          ]
        ],
        [
          "O que indica o andamento de uma música?",
          "Sua velocidade",
          [
            "Piano",
            "Flauta",
            "Violino"
          ]
        ],
        [
          "Qual gênero brasileiro nasceu no Rio de Janeiro?",
          "Samba",
          [
            "Blues",
            "Jazz",
            "Bossa nova"
          ]
        ],
        [
          "Quantos tempos tem um compasso 4/4?",
          "4",
          [
            "Trompete",
            "Clarinete",
            "Saxofone"
          ]
        ],
        [
          "Como se chama um grupo de três músicos?",
          "Trio",
          [
            "Orquestra",
            "Banda",
            "Coro"
          ]
        ],
        [
          "Qual símbolo indica silêncio musical?",
          "Pausa",
          [
            "Clave de sol",
            "Sustenido",
            "Bequadro"
          ]
        ],
        [
          "Quantas notas naturais existem na escala musical ocidental?",
          "7",
          [
            "Lá",
            "Si",
            "Dó"
          ]
        ],
        [
          "Qual nota vem depois de dó?",
          "Ré",
          [
            "Lá",
            "Mi",
            "Dó"
          ]
        ],
        [
          "Qual nota vem antes de si?",
          "Lá",
          [
            "Ré",
            "Dó",
            "Mi"
          ]
        ],
        [
          "Qual símbolo eleva uma nota em meio tom?",
          "Sustenido",
          [
            "Dó",
            "Ré",
            "Lá"
          ]
        ],
        [
          "Qual símbolo abaixa uma nota em meio tom?",
          "Bemol",
          [
            "Ré",
            "Si",
            "Lá"
          ]
        ],
        [
          "Como se chama a velocidade de uma música?",
          "Andamento",
          [
            "Clarinete",
            "Trompete",
            "Violão"
          ]
        ],
        [
          "Como se chama a intensidade sonora em música?",
          "Dinâmica",
          [
            "Violino",
            "Violão",
            "Tambor"
          ]
        ],
        [
          "Qual instrumento possui teclas brancas e pretas?",
          "Piano",
          [
            "Trompete",
            "Clarinete",
            "Violoncelo"
          ]
        ],
        [
          "Qual instrumento de cordas é tocado com arco e apoiado no ombro?",
          "Violino",
          [
            "Saxofone",
            "Violão",
            "Trombone"
          ]
        ],
        [
          "Qual instrumento de sopro de metal possui vara deslizante?",
          "Trombone",
          [
            "Trompete",
            "Piano",
            "Clarinete"
          ]
        ],
        [
          "Qual instrumento de percussão possui pele esticada?",
          "Tambor",
          [
            "Violino",
            "Violoncelo",
            "Trompete"
          ]
        ],
        [
          "Qual instrumento tem seis cordas em sua forma comum?",
          "Violão",
          [
            "Flauta",
            "Piano",
            "Trombone"
          ]
        ],
        [
          "Qual é a voz feminina mais aguda?",
          "Soprano",
          [
            "Saxofone",
            "Violão",
            "Clarinete"
          ]
        ],
        [
          "Qual é a voz masculina mais grave?",
          "Baixo",
          [
            "Saxofone",
            "Piano",
            "Violino"
          ]
        ],
        [
          "Como se chama um grupo de cantores?",
          "Coro",
          [
            "Orquestra",
            "Banda",
            "Quarteto"
          ]
        ],
        [
          "Como se chama um grupo grande de instrumentistas?",
          "Orquestra",
          [
            "Quarteto",
            "Trio",
            "Coro"
          ]
        ],
        [
          "Quem compôs “As Quatro Estações”?",
          "Antonio Vivaldi",
          [
            "Ludwig van Beethoven",
            "Johann Sebastian Bach",
            "Wolfgang Amadeus Mozart"
          ]
        ],
        [
          "Quem compôs “O Quebra-Nozes”?",
          "Piotr Ilitch Tchaikovsky",
          [
            "Ludwig van Beethoven",
            "Johann Sebastian Bach",
            "Antonio Vivaldi"
          ]
        ],
        [
          "Quem foi chamado de Rei do Pop?",
          "Michael Jackson",
          [
            "Flauta",
            "Clarinete",
            "Violão"
          ]
        ],
        [
          "Qual gênero musical nasceu em Nova Orleans?",
          "Jazz",
          [
            "Blues",
            "Hip-hop",
            "Bossa nova"
          ]
        ],
        [
          "Qual gênero brasileiro é associado ao carnaval do Rio de Janeiro?",
          "Samba",
          [
            "Bossa nova",
            "Forró",
            "Hip-hop"
          ]
        ],
        [
          "Qual gênero brasileiro surgiu no Nordeste e usa sanfona?",
          "Forró",
          [
            "Hip-hop",
            "Samba",
            "Bossa nova"
          ]
        ],
        [
          "Qual ritmo jamaicano é associado a Bob Marley?",
          "Reggae",
          [
            "Jazz",
            "Forró",
            "Bossa nova"
          ]
        ],
        [
          "Qual gênero surgiu nos Estados Unidos com DJs e rimas?",
          "Hip-hop",
          [
            "Reggae",
            "Blues",
            "Rock"
          ]
        ],
        [
          "Como se chama a parte repetida de uma canção?",
          "Refrão",
          [
            "Trompete",
            "Flauta",
            "Piano"
          ]
        ],
        [
          "Como se chama a sequência organizada de sons e silêncios?",
          "Ritmo",
          [
            "Trombone",
            "Violino",
            "Violoncelo"
          ]
        ],
        [
          "Como se chama a sucessão de notas que forma uma ideia musical?",
          "Melodia",
          [
            "Sol",
            "Mi",
            "Dó"
          ]
        ],
        [
          "Como se chama a combinação simultânea de sons?",
          "Harmonia",
          [
            "Trombone",
            "Flauta",
            "Clarinete"
          ]
        ],
        [
          "Qual clave é usada frequentemente para sons agudos?",
          "Clave de sol",
          [
            "Bequadro",
            "Bemol",
            "Sustenido"
          ]
        ],
        [
          "Qual clave é usada frequentemente para sons graves?",
          "Clave de fá",
          [
            "Violoncelo",
            "Violino",
            "Violão"
          ]
        ],
        [
          "Quantas semínimas cabem normalmente em um compasso 4/4?",
          "4",
          [
            "Violão",
            "Violoncelo",
            "Piano"
          ]
        ],
        [
          "Qual instrumento eletrônico possui pratos e toca discos?",
          "Toca-discos",
          [
            "Flauta",
            "Trompete",
            "Violão"
          ]
        ],
        [
          "Qual família de instrumentos é marcante nas orquestras de frevo?",
          "Metais",
          [
            "Flauta",
            "Violoncelo",
            "Trombone"
          ]
        ],
        [
          "Qual instrumento é central no choro brasileiro?",
          "Cavaquinho",
          [
            "Trombone",
            "Violino",
            "Saxofone"
          ]
        ],
        [
          "Qual instrumento de teclas usa foles?",
          "Acordeão",
          [
            "Violão",
            "Trombone",
            "Clarinete"
          ]
        ],
        [
          "Qual instrumento indígena brasileiro é feito de chocalho?",
          "Maracá",
          [
            "Trombone",
            "Clarinete",
            "Piano"
          ]
        ],
        [
          "Como se chama uma composição para uma voz solo?",
          "Solo",
          [
            "Piano",
            "Violoncelo",
            "Trompete"
          ]
        ],
        [
          "Como se chama uma apresentação de música ao vivo?",
          "Concerto",
          [
            "Trompete",
            "Clarinete",
            "Flauta"
          ]
        ],
        [
          "Qual profissional rege uma orquestra?",
          "Maestro",
          [
            "Piano",
            "Violão",
            "Trompete"
          ]
        ],
        [
          "Como se chama uma peça musical escrita para dois intérpretes?",
          "Dueto",
          [
            "Clarinete",
            "Flauta",
            "Trompete"
          ]
        ]
      ]
    },
    {
      "slug": "esportes",
      "questions": [
        [
          "Quantos jogadores cada time tem em campo no futebol?",
          "11",
          [
            "7",
            "5",
            "15"
          ]
        ],
        [
          "Qual esporte usa uma cesta e uma bola laranja?",
          "Basquete",
          [
            "Vôlei",
            "Judô",
            "Futebol"
          ]
        ],
        [
          "Quantos anéis há no símbolo olímpico?",
          "5",
          [
            "11",
            "7",
            "15"
          ]
        ],
        [
          "Em qual esporte se usa uma raquete e uma peteca?",
          "Badminton",
          [
            "Beisebol",
            "Saltos ornamentais",
            "Arremesso de peso"
          ]
        ],
        [
          "Qual país sediou a Copa do Mundo de 2014?",
          "Brasil",
          [
            "Japão",
            "China",
            "Estados Unidos"
          ]
        ],
        [
          "Quantos sets um time precisa vencer no vôlei melhor de cinco?",
          "3",
          [
            "15",
            "5",
            "6"
          ]
        ],
        [
          "Qual é a distância oficial de uma maratona?",
          "42,195 km",
          [
            "15",
            "7",
            "6"
          ]
        ],
        [
          "Em qual esporte há nado borboleta?",
          "Natação",
          [
            "Tênis",
            "Esgrima",
            "Futebol"
          ]
        ],
        [
          "Que cartão expulsa um jogador no futebol?",
          "Vermelho",
          [
            "5",
            "6",
            "11"
          ]
        ],
        [
          "Qual peça vale mais no xadrez depois do rei?",
          "Dama",
          [
            "Peão",
            "Bispo",
            "Cavalo"
          ]
        ],
        [
          "Quantos jogadores cada time tem em quadra no basquete?",
          "5",
          [
            "6",
            "7",
            "15"
          ]
        ],
        [
          "Quantos jogadores cada time tem em quadra no vôlei?",
          "6",
          [
            "5",
            "7",
            "15"
          ]
        ],
        [
          "Quantos jogadores cada time tem em quadra no futsal?",
          "5",
          [
            "6",
            "11",
            "7"
          ]
        ],
        [
          "Quantos jogadores formam uma equipe de handebol em quadra?",
          "7",
          [
            "6",
            "15",
            "5"
          ]
        ],
        [
          "Qual esporte usa taco, bases e bola?",
          "Beisebol",
          [
            "Tiro com arco",
            "Tênis",
            "Handebol"
          ]
        ],
        [
          "Qual esporte usa tacos e um pequeno disco no gelo?",
          "Hóquei no gelo",
          [
            "Basquete",
            "Tênis",
            "Tênis de mesa"
          ]
        ],
        [
          "Qual esporte é praticado sobre uma prancha nas ondas?",
          "Surfe",
          [
            "Basquete",
            "Futebol",
            "Judô"
          ]
        ],
        [
          "Qual esporte envolve saltos ornamentais em piscina?",
          "Saltos ornamentais",
          [
            "Vôlei",
            "Handebol",
            "Tiro com arco"
          ]
        ],
        [
          "Qual esporte combina natação, ciclismo e corrida?",
          "Triatlo",
          [
            "Tiro com arco",
            "Tênis",
            "Arremesso de peso"
          ]
        ],
        [
          "Qual esporte usa arco e flecha?",
          "Tiro com arco",
          [
            "Futebol",
            "Vôlei",
            "Basquete"
          ]
        ],
        [
          "Em qual esporte existe o golpe chamado ippon?",
          "Judô",
          [
            "Basquete",
            "Tiro com arco",
            "Handebol"
          ]
        ],
        [
          "Em qual esporte os atletas usam florete, espada ou sabre?",
          "Esgrima",
          [
            "Triatlo",
            "Vôlei",
            "Tênis"
          ]
        ],
        [
          "Qual esporte é disputado em um ringue com luvas?",
          "Boxe",
          [
            "Futebol",
            "Vôlei",
            "Futsal"
          ]
        ],
        [
          "Qual esporte utiliza aparelhos como trave e barras assimétricas?",
          "Ginástica artística",
          [
            "Arremesso de peso",
            "Tênis",
            "Judô"
          ]
        ],
        [
          "Qual esporte é praticado com raquete sobre uma mesa?",
          "Tênis de mesa",
          [
            "Vôlei",
            "Saltos ornamentais",
            "Arremesso de peso"
          ]
        ],
        [
          "Quantos pontos vale um touchdown no futebol americano?",
          "6",
          [
            "11",
            "5",
            "15"
          ]
        ],
        [
          "Quantos pontos vale uma cesta de lance livre no basquete?",
          "1",
          [
            "5",
            "11",
            "7"
          ]
        ],
        [
          "Quantos pontos vale uma cesta feita além da linha de três?",
          "3",
          [
            "11",
            "7",
            "5"
          ]
        ],
        [
          "Qual país é tradicionalmente associado à origem do judô?",
          "Japão",
          [
            "Brasil",
            "França",
            "Inglaterra"
          ]
        ],
        [
          "Qual país é associado à origem do taekwondo?",
          "Coreia do Sul",
          [
            "Brasil",
            "Japão",
            "França"
          ]
        ],
        [
          "Qual competição reúne seleções sul-americanas de futebol?",
          "Copa América",
          [
            "Jogos Olímpicos",
            "Copa do Mundo",
            "Super Bowl"
          ]
        ],
        [
          "Qual competição europeia reúne clubes campeões e classificados?",
          "Liga dos Campeões da UEFA",
          [
            "Super Bowl",
            "Copa do Mundo",
            "Jogos Olímpicos"
          ]
        ],
        [
          "Qual esporte tem Roland Garros como torneio importante?",
          "Tênis",
          [
            "Futebol",
            "Tênis de mesa",
            "Saltos ornamentais"
          ]
        ],
        [
          "Qual esporte tem Wimbledon como torneio importante?",
          "Tênis",
          [
            "Futsal",
            "Tênis de mesa",
            "Triatlo"
          ]
        ],
        [
          "Qual prova de atletismo usa um bastão entre corredores?",
          "Revezamento",
          [
            "5",
            "6",
            "7"
          ]
        ],
        [
          "Qual prova lança uma esfera pesada?",
          "Arremesso de peso",
          [
            "Vôlei",
            "Futebol",
            "Basquete"
          ]
        ],
        [
          "Qual prova atlética lança uma haste longa?",
          "Lançamento de dardo",
          [
            "6",
            "5",
            "11"
          ]
        ],
        [
          "Qual esporte é jogado em 18 buracos?",
          "Golfe",
          [
            "Arremesso de peso",
            "Tiro com arco",
            "Basquete"
          ]
        ],
        [
          "Qual peça do xadrez move-se em forma de L?",
          "Cavalo",
          [
            "Rainha",
            "Rei",
            "Bispo"
          ]
        ],
        [
          "Qual peça do xadrez move-se apenas na diagonal?",
          "Bispo",
          [
            "Torre",
            "Cavalo",
            "Rei"
          ]
        ],
        [
          "Qual peça do xadrez pode fazer o roque com o rei?",
          "Torre",
          [
            "Cavalo",
            "Bispo",
            "Rainha"
          ]
        ],
        [
          "Qual é o objetivo no xadrez?",
          "Dar xeque-mate ao rei",
          [
            "Cavalo",
            "Bispo",
            "Peão"
          ]
        ],
        [
          "Quantos períodos tem uma partida oficial de basquete FIBA?",
          "4",
          [
            "15",
            "11",
            "7"
          ]
        ],
        [
          "Qual esporte usa scrum?",
          "Rugby",
          [
            "Futsal",
            "Tiro com arco",
            "Arremesso de peso"
          ]
        ],
        [
          "Qual esporte possui posições como levantador e líbero?",
          "Vôlei",
          [
            "Tiro com arco",
            "Basquete",
            "Arremesso de peso"
          ]
        ],
        [
          "Qual esporte usa uma bola oval e traves em H?",
          "Rugby",
          [
            "Triatlo",
            "Saltos ornamentais",
            "Tênis"
          ]
        ],
        [
          "Qual arte marcial brasileira combina luta, música e movimentos acrobáticos?",
          "Capoeira",
          [
            "6",
            "7",
            "5"
          ]
        ],
        [
          "Qual prova olímpica usa canoa ou caiaque?",
          "Canoagem",
          [
            "6",
            "15",
            "11"
          ]
        ],
        [
          "Qual esporte de inverno usa pedras e vassouras no gelo?",
          "Curling",
          [
            "Vôlei",
            "Triatlo",
            "Saltos ornamentais"
          ]
        ],
        [
          "Qual esporte envolve levantamento de barras com pesos?",
          "Halterofilismo",
          [
            "Arremesso de peso",
            "Tiro com arco",
            "Beisebol"
          ]
        ]
      ]
    },
    {
      "slug": "cinema-e-tv",
      "questions": [
        [
          "Quem dirige a criação artística de um filme?",
          "Diretor",
          [
            "Ator",
            "Roteirista",
            "Produtor"
          ]
        ],
        [
          "Qual prêmio é tradicional no cinema dos Estados Unidos?",
          "Oscar",
          [
            "Globo de Ouro",
            "Emmy",
            "Palma de Ouro"
          ]
        ],
        [
          "Como se chama o texto com cenas e diálogos?",
          "Roteiro",
          [
            "Créditos",
            "Casting",
            "Elenco"
          ]
        ],
        [
          "Qual profissional interpreta personagens?",
          "Ator",
          [
            "Diretor",
            "Cenógrafo",
            "Editor"
          ]
        ],
        [
          "O que é uma sequência?",
          "Continuação de uma obra",
          [
            "Produtor",
            "Figurinista",
            "Editor"
          ]
        ],
        [
          "Qual gênero busca provocar medo?",
          "Terror",
          [
            "Faroeste",
            "Romance",
            "Comédia"
          ]
        ],
        [
          "O que faz a direção de fotografia?",
          "Define imagem e iluminação",
          [
            "Cenógrafo",
            "Ator",
            "Editor"
          ]
        ],
        [
          "Como se chama a música criada para um filme?",
          "Trilha sonora",
          [
            "Curta-metragem",
            "Créditos",
            "Casting"
          ]
        ],
        [
          "O que é um documentário?",
          "Obra sobre fatos e pessoas reais",
          [
            "Cenógrafo",
            "Editor",
            "Diretor"
          ]
        ],
        [
          "Qual formato conta uma história em episódios?",
          "Série",
          [
            "Produtor",
            "Ator",
            "Roteirista"
          ]
        ],
        [
          "Como se chama o conjunto de atores de uma produção audiovisual?",
          "Elenco",
          [
            "Editor",
            "Roteirista",
            "Cenógrafo"
          ]
        ],
        [
          "Como se chama o processo de escolher atores?",
          "Casting",
          [
            "Cenógrafo",
            "Diretor",
            "Diretor de fotografia"
          ]
        ],
        [
          "Qual profissional monta as cenas gravadas?",
          "Editor",
          [
            "Figurinista",
            "Produtor",
            "Diretor"
          ]
        ],
        [
          "Qual profissional cria os figurinos?",
          "Figurinista",
          [
            "Diretor",
            "Ator",
            "Cenógrafo"
          ]
        ],
        [
          "Qual profissional cria os cenários?",
          "Cenógrafo",
          [
            "Figurinista",
            "Roteirista",
            "Editor"
          ]
        ],
        [
          "Qual profissional registra o som no set?",
          "Técnico de som",
          [
            "Produtor",
            "Diretor de fotografia",
            "Cenógrafo"
          ]
        ],
        [
          "Como se chama uma gravação curta usada para promover um filme?",
          "Trailer",
          [
            "Dublagem",
            "Casting",
            "Trilha sonora"
          ]
        ],
        [
          "Como se chama a lista de profissionais ao fim de uma obra?",
          "Créditos",
          [
            "Curta-metragem",
            "Dublagem",
            "Casting"
          ]
        ],
        [
          "O que é dublagem?",
          "Substituição das vozes originais por outras",
          [
            "Ator",
            "Diretor de fotografia",
            "Diretor"
          ]
        ],
        [
          "O que é legenda?",
          "Texto escrito que traduz ou transcreve falas",
          [
            "Cenógrafo",
            "Figurinista",
            "Ator"
          ]
        ],
        [
          "O que é animação?",
          "Criação de movimento por sequência de imagens",
          [
            "Cenógrafo",
            "Produtor",
            "Roteirista"
          ]
        ],
        [
          "O que é um curta-metragem?",
          "Filme de curta duração",
          [
            "Roteirista",
            "Editor",
            "Produtor"
          ]
        ],
        [
          "O que é um longa-metragem?",
          "Filme de duração extensa",
          [
            "Diretor de fotografia",
            "Figurinista",
            "Diretor"
          ]
        ],
        [
          "Qual gênero utiliza músicas e coreografias como parte da narrativa?",
          "Musical",
          [
            "Comédia",
            "Terror",
            "Documentário"
          ]
        ],
        [
          "Qual gênero busca provocar riso?",
          "Comédia",
          [
            "Terror",
            "Drama",
            "Romance"
          ]
        ],
        [
          "Qual gênero explora fatos científicos ou históricos reais?",
          "Documentário",
          [
            "Romance",
            "Comédia",
            "Terror"
          ]
        ],
        [
          "Qual gênero costuma abordar crimes e investigação?",
          "Policial",
          [
            "Drama",
            "Terror",
            "Documentário"
          ]
        ],
        [
          "Qual gênero apresenta mundos futuros e tecnologia imaginada?",
          "Ficção científica",
          [
            "Drama",
            "Comédia",
            "Documentário"
          ]
        ],
        [
          "Qual gênero se passa no Velho Oeste?",
          "Faroeste",
          [
            "Policial",
            "Documentário",
            "Comédia"
          ]
        ],
        [
          "O que é um episódio piloto?",
          "Primeiro episódio usado para apresentar uma série",
          [
            "Cenógrafo",
            "Produtor",
            "Editor"
          ]
        ],
        [
          "O que é uma temporada?",
          "Conjunto de episódios lançados em um período",
          [
            "Ator",
            "Diretor",
            "Produtor"
          ]
        ],
        [
          "O que é um spin-off?",
          "Obra derivada de outra",
          [
            "Figurinista",
            "Produtor",
            "Diretor de fotografia"
          ]
        ],
        [
          "O que é um remake?",
          "Nova versão de uma obra anterior",
          [
            "Editor",
            "Roteirista",
            "Figurinista"
          ]
        ],
        [
          "O que é uma prequela?",
          "História ambientada antes da obra original",
          [
            "Cenógrafo",
            "Produtor",
            "Diretor de fotografia"
          ]
        ],
        [
          "O que é uma sequência cinematográfica?",
          "Continuação posterior da história",
          [
            "Figurinista",
            "Editor",
            "Diretor de fotografia"
          ]
        ],
        [
          "Qual prêmio é voltado principalmente à televisão nos Estados Unidos?",
          "Emmy",
          [
            "Palma de Ouro",
            "BAFTA",
            "Globo de Ouro"
          ]
        ],
        [
          "Qual festival de cinema concede a Palma de Ouro?",
          "Festival de Cannes",
          [
            "Produtor",
            "Editor",
            "Cenógrafo"
          ]
        ],
        [
          "Qual festival alemão concede o Urso de Ouro?",
          "Festival de Berlim",
          [
            "Cenógrafo",
            "Figurinista",
            "Diretor"
          ]
        ],
        [
          "Qual festival italiano concede o Leão de Ouro?",
          "Festival de Veneza",
          [
            "Produtor",
            "Cenógrafo",
            "Figurinista"
          ]
        ],
        [
          "Quem criou o personagem Mickey Mouse com Ub Iwerks?",
          "Walt Disney",
          [
            "Roteirista",
            "Produtor",
            "Figurinista"
          ]
        ],
        [
          "Qual estúdio produziu “Toy Story”?",
          "Pixar",
          [
            "Ator",
            "Cenógrafo",
            "Diretor"
          ]
        ],
        [
          "Qual técnica usa fundo verde para inserir cenários digitais?",
          "Chroma key",
          [
            "Diretor de fotografia",
            "Cenógrafo",
            "Produtor"
          ]
        ],
        [
          "Como se chama a imagem que enquadra uma cena?",
          "Plano",
          [
            "Curta-metragem",
            "Dublagem",
            "Elenco"
          ]
        ],
        [
          "Como se chama a mudança suave entre duas imagens?",
          "Dissolvência",
          [
            "Dublagem",
            "Créditos",
            "Trilha sonora"
          ]
        ],
        [
          "Como se chama o conjunto de escolhas visuais de luz e câmera?",
          "Fotografia",
          [
            "Casting",
            "Dublagem",
            "Animação"
          ]
        ],
        [
          "O que é audiência televisiva?",
          "Número ou proporção de espectadores",
          [
            "Ator",
            "Produtor",
            "Editor"
          ]
        ],
        [
          "O que é transmissão ao vivo?",
          "Exibição no momento em que ocorre",
          [
            "Diretor de fotografia",
            "Roteirista",
            "Diretor"
          ]
        ],
        [
          "O que é streaming?",
          "Distribuição de conteúdo pela internet",
          [
            "Roteirista",
            "Editor",
            "Diretor"
          ]
        ],
        [
          "O que é sitcom?",
          "Comédia de situação em episódios",
          [
            "Diretor",
            "Roteirista",
            "Figurinista"
          ]
        ],
        [
          "O que é reality show?",
          "Programa baseado em situações e participantes reais",
          [
            "Figurinista",
            "Ator",
            "Roteirista"
          ]
        ]
      ]
    },
    {
      "slug": "literatura",
      "questions": [
        [
          "Quem escreveu 'Dom Casmurro'?",
          "Machado de Assis",
          [
            "J. K. Rowling",
            "Ariano Suassuna",
            "Miguel de Cervantes"
          ]
        ],
        [
          "Quem escreveu 'O Pequeno Príncipe'?",
          "Antoine de Saint-Exupéry",
          [
            "Ariano Suassuna",
            "Clarice Lispector",
            "Liev Tolstói"
          ]
        ],
        [
          "O que é um narrador?",
          "A voz que conta a história",
          [
            "Franz Kafka",
            "Euclides da Cunha",
            "José de Alencar"
          ]
        ],
        [
          "Qual gênero costuma ser escrito em versos?",
          "Poesia",
          [
            "Crônica",
            "Biografia",
            "Conto"
          ]
        ],
        [
          "Quem criou Sherlock Holmes?",
          "Arthur Conan Doyle",
          [
            "Euclides da Cunha",
            "Liev Tolstói",
            "João Guimarães Rosa"
          ]
        ],
        [
          "Qual obra começa com a viagem de Bilbo?",
          "O Hobbit",
          [
            "Lewis Carroll",
            "Oscar Wilde",
            "João Guimarães Rosa"
          ]
        ],
        [
          "Como se chama a personagem principal?",
          "Protagonista",
          [
            "Lewis Carroll",
            "Homero",
            "Graciliano Ramos"
          ]
        ],
        [
          "Quem escreveu 'Quarto de Despejo'?",
          "Carolina Maria de Jesus",
          [
            "Mark Twain",
            "Euclides da Cunha",
            "José de Alencar"
          ]
        ],
        [
          "O que é uma fábula?",
          "Narrativa curta com ensinamento",
          [
            "George Orwell",
            "J. R. R. Tolkien",
            "Liev Tolstói"
          ]
        ],
        [
          "Qual autor escreveu 'Romeu e Julieta'?",
          "William Shakespeare",
          [
            "Liev Tolstói",
            "Dante Alighieri",
            "J. K. Rowling"
          ]
        ],
        [
          "Quem escreveu “Memórias Póstumas de Brás Cubas”?",
          "Machado de Assis",
          [
            "Miguel de Cervantes",
            "Homero",
            "Fiódor Dostoiévski"
          ]
        ],
        [
          "Quem escreveu “Iracema”?",
          "José de Alencar",
          [
            "Miguel de Cervantes",
            "Ariano Suassuna",
            "Clarice Lispector"
          ]
        ],
        [
          "Quem escreveu “Vidas Secas”?",
          "Graciliano Ramos",
          [
            "Ariano Suassuna",
            "Lewis Carroll",
            "J. R. R. Tolkien"
          ]
        ],
        [
          "Quem escreveu “Grande Sertão: Veredas”?",
          "João Guimarães Rosa",
          [
            "J. R. R. Tolkien",
            "Fiódor Dostoiévski",
            "Miguel de Cervantes"
          ]
        ],
        [
          "Quem escreveu “A Hora da Estrela”?",
          "Clarice Lispector",
          [
            "Fiódor Dostoiévski",
            "Dante Alighieri",
            "Miguel de Cervantes"
          ]
        ],
        [
          "Quem escreveu “Capitães da Areia”?",
          "Jorge Amado",
          [
            "Mark Twain",
            "J. R. R. Tolkien",
            "Liev Tolstói"
          ]
        ],
        [
          "Quem escreveu “Morte e Vida Severina”?",
          "João Cabral de Melo Neto",
          [
            "Oscar Wilde",
            "Franz Kafka",
            "Dante Alighieri"
          ]
        ],
        [
          "Quem escreveu “A Bolsa Amarela”?",
          "Lygia Bojunga",
          [
            "João Guimarães Rosa",
            "José de Alencar",
            "Dante Alighieri"
          ]
        ],
        [
          "Quem escreveu “O Auto da Compadecida”?",
          "Ariano Suassuna",
          [
            "Liev Tolstói",
            "Lewis Carroll",
            "Miguel de Cervantes"
          ]
        ],
        [
          "Quem escreveu “Os Sertões”?",
          "Euclides da Cunha",
          [
            "Ariano Suassuna",
            "Homero",
            "J. R. R. Tolkien"
          ]
        ],
        [
          "Quem escreveu “A Divina Comédia”?",
          "Dante Alighieri",
          [
            "Franz Kafka",
            "Clarice Lispector",
            "Fiódor Dostoiévski"
          ]
        ],
        [
          "Quem escreveu “Dom Quixote”?",
          "Miguel de Cervantes",
          [
            "Lewis Carroll",
            "José de Alencar",
            "Ariano Suassuna"
          ]
        ],
        [
          "Quem escreveu “Os Miseráveis”?",
          "Victor Hugo",
          [
            "Lewis Carroll",
            "Clarice Lispector",
            "Euclides da Cunha"
          ]
        ],
        [
          "Quem escreveu “Orgulho e Preconceito”?",
          "Jane Austen",
          [
            "Liev Tolstói",
            "João Guimarães Rosa",
            "Clarice Lispector"
          ]
        ],
        [
          "Quem escreveu “1984”?",
          "George Orwell",
          [
            "João Guimarães Rosa",
            "Franz Kafka",
            "Euclides da Cunha"
          ]
        ],
        [
          "Quem escreveu “A Metamorfose”?",
          "Franz Kafka",
          [
            "Fiódor Dostoiévski",
            "Machado de Assis",
            "Miguel de Cervantes"
          ]
        ],
        [
          "Quem escreveu “O Retrato de Dorian Gray”?",
          "Oscar Wilde",
          [
            "Homero",
            "Lewis Carroll",
            "Euclides da Cunha"
          ]
        ],
        [
          "Quem escreveu “Crime e Castigo”?",
          "Fiódor Dostoiévski",
          [
            "Euclides da Cunha",
            "Liev Tolstói",
            "George Orwell"
          ]
        ],
        [
          "Quem escreveu “Guerra e Paz”?",
          "Liev Tolstói",
          [
            "Fiódor Dostoiévski",
            "Graciliano Ramos",
            "Dante Alighieri"
          ]
        ],
        [
          "Quem escreveu “Cem Anos de Solidão”?",
          "Gabriel García Márquez",
          [
            "Dante Alighieri",
            "Miguel de Cervantes",
            "Graciliano Ramos"
          ]
        ],
        [
          "Quem escreveu “A Odisseia”?",
          "Homero",
          [
            "Dante Alighieri",
            "Lewis Carroll",
            "Oscar Wilde"
          ]
        ],
        [
          "Quem escreveu “A Ilíada”?",
          "Homero",
          [
            "Dante Alighieri",
            "J. K. Rowling",
            "J. R. R. Tolkien"
          ]
        ],
        [
          "Quem escreveu “O Senhor dos Anéis”?",
          "J. R. R. Tolkien",
          [
            "Mark Twain",
            "Fiódor Dostoiévski",
            "Dante Alighieri"
          ]
        ],
        [
          "Quem escreveu “Harry Potter”?",
          "J. K. Rowling",
          [
            "Franz Kafka",
            "Machado de Assis",
            "Fiódor Dostoiévski"
          ]
        ],
        [
          "Quem escreveu “Alice no País das Maravilhas”?",
          "Lewis Carroll",
          [
            "João Guimarães Rosa",
            "Clarice Lispector",
            "José de Alencar"
          ]
        ],
        [
          "Quem escreveu “As Aventuras de Tom Sawyer”?",
          "Mark Twain",
          [
            "Graciliano Ramos",
            "George Orwell",
            "Machado de Assis"
          ]
        ],
        [
          "Quem escreveu “Vinte Mil Léguas Submarinas”?",
          "Jules Verne",
          [
            "Machado de Assis",
            "José de Alencar",
            "Mark Twain"
          ]
        ],
        [
          "Quem escreveu “O Conde de Monte Cristo”?",
          "Alexandre Dumas",
          [
            "Graciliano Ramos",
            "Homero",
            "Ariano Suassuna"
          ]
        ],
        [
          "Quem escreveu “Frankenstein”?",
          "Mary Shelley",
          [
            "Lewis Carroll",
            "José de Alencar",
            "Ariano Suassuna"
          ]
        ],
        [
          "Quem escreveu “Drácula”?",
          "Bram Stoker",
          [
            "Dante Alighieri",
            "Euclides da Cunha",
            "João Guimarães Rosa"
          ]
        ],
        [
          "O que é antagonista?",
          "Personagem ou força que se opõe ao protagonista",
          [
            "Liev Tolstói",
            "José de Alencar",
            "Mark Twain"
          ]
        ],
        [
          "O que é enredo?",
          "Sequência de acontecimentos da narrativa",
          [
            "João Guimarães Rosa",
            "Clarice Lispector",
            "Liev Tolstói"
          ]
        ],
        [
          "O que é cenário?",
          "Lugar e ambiente onde ocorre a história",
          [
            "Machado de Assis",
            "Oscar Wilde",
            "Dante Alighieri"
          ]
        ],
        [
          "O que é clímax?",
          "Momento de maior tensão da narrativa",
          [
            "Homero",
            "J. K. Rowling",
            "Clarice Lispector"
          ]
        ],
        [
          "O que é metáfora?",
          "Comparação implícita",
          [
            "Oscar Wilde",
            "Fiódor Dostoiévski",
            "J. R. R. Tolkien"
          ]
        ],
        [
          "O que é soneto?",
          "Poema tradicional de quatorze versos",
          [
            "Homero",
            "J. R. R. Tolkien",
            "Machado de Assis"
          ]
        ],
        [
          "O que é crônica?",
          "Texto breve ligado ao cotidiano",
          [
            "José de Alencar",
            "Homero",
            "Fiódor Dostoiévski"
          ]
        ],
        [
          "O que é romance literário?",
          "Narrativa longa em prosa",
          [
            "Fiódor Dostoiévski",
            "Euclides da Cunha",
            "Machado de Assis"
          ]
        ],
        [
          "O que é conto?",
          "Narrativa curta em prosa",
          [
            "J. R. R. Tolkien",
            "Ariano Suassuna",
            "Lewis Carroll"
          ]
        ],
        [
          "O que é biografia?",
          "Relato da vida de uma pessoa",
          [
            "João Guimarães Rosa",
            "Fiódor Dostoiévski",
            "Graciliano Ramos"
          ]
        ]
      ]
    },
    {
      "slug": "cultura-geral",
      "questions": [
        [
          "Qual é a moeda do Japão?",
          "Iene",
          [
            "Real",
            "Libra esterlina",
            "Euro"
          ]
        ],
        [
          "Quantos dias tem um ano bissexto?",
          "366",
          [
            "7",
            "365",
            "60"
          ]
        ],
        [
          "Qual é o maior mamífero do mundo?",
          "Baleia-azul",
          [
            "Elefante-africano",
            "Canguru",
            "Tigre"
          ]
        ],
        [
          "Qual idioma tem mais falantes nativos?",
          "Mandarim",
          [
            "Português",
            "Espanhol",
            "Árabe"
          ]
        ],
        [
          "Qual metal tem símbolo químico Au?",
          "Ouro",
          [
            "Franco suíço",
            "Peso argentino",
            "Dólar"
          ]
        ],
        [
          "Qual país tem formato lembrado como uma bota?",
          "Itália",
          [
            "Iene",
            "Franco suíço",
            "Peso argentino"
          ]
        ],
        [
          "Quantos lados tem um hexágono?",
          "6",
          [
            "7",
            "60",
            "365"
          ]
        ],
        [
          "Qual é o nome do satélite natural da Terra?",
          "Lua",
          [
            "Euro",
            "Libra esterlina",
            "Real"
          ]
        ],
        [
          "Qual cor resulta da mistura de azul e amarelo?",
          "Verde",
          [
            "Peso argentino",
            "Franco suíço",
            "Euro"
          ]
        ],
        [
          "Qual é o primeiro mês do ano?",
          "Janeiro",
          [
            "Dólar",
            "Peso argentino",
            "Franco suíço"
          ]
        ],
        [
          "Qual é a moeda dos Estados Unidos?",
          "Dólar",
          [
            "Iene",
            "Franco suíço",
            "Real"
          ]
        ],
        [
          "Qual é a moeda do Reino Unido?",
          "Libra esterlina",
          [
            "Euro",
            "Dólar",
            "Iene"
          ]
        ],
        [
          "Qual é a moeda usada por muitos países da União Europeia?",
          "Euro",
          [
            "Libra esterlina",
            "Iene",
            "Dólar"
          ]
        ],
        [
          "Quantos dias tem uma semana?",
          "7",
          [
            "60",
            "24",
            "365"
          ]
        ],
        [
          "Quantos meses tem um ano?",
          "12",
          [
            "365",
            "7",
            "366"
          ]
        ],
        [
          "Quantas horas tem um dia?",
          "24",
          [
            "366",
            "12",
            "365"
          ]
        ],
        [
          "Quantos minutos tem uma hora?",
          "60",
          [
            "7",
            "12",
            "24"
          ]
        ],
        [
          "Qual é o maior animal terrestre?",
          "Elefante-africano",
          [
            "Girafa",
            "Baleia-azul",
            "Panda-gigante"
          ]
        ],
        [
          "Qual é o animal terrestre mais alto?",
          "Girafa",
          [
            "Panda-gigante",
            "Tigre",
            "Canguru"
          ]
        ],
        [
          "Qual é o maior felino do mundo?",
          "Tigre",
          [
            "Baleia-azul",
            "Canguru",
            "Girafa"
          ]
        ],
        [
          "Qual é o idioma oficial do Brasil?",
          "Português",
          [
            "Inglês",
            "Francês",
            "Árabe"
          ]
        ],
        [
          "Qual é o idioma oficial predominante da Argentina?",
          "Espanhol",
          [
            "Mandarim",
            "Árabe",
            "Português"
          ]
        ],
        [
          "Qual é o símbolo químico da prata?",
          "Ag",
          [
            "Peso argentino",
            "Euro",
            "Libra esterlina"
          ]
        ],
        [
          "Qual é o símbolo químico do ferro?",
          "Fe",
          [
            "Dólar",
            "Euro",
            "Real"
          ]
        ],
        [
          "Qual metal é atraído fortemente por ímãs?",
          "Ferro",
          [
            "Hidrogênio",
            "Oxigênio",
            "Hélio"
          ]
        ],
        [
          "Quantos continentes são normalmente considerados no modelo de seis continentes?",
          "6",
          [
            "60",
            "24",
            "365"
          ]
        ],
        [
          "Quantos planetas há no Sistema Solar?",
          "8",
          [
            "12",
            "60",
            "366"
          ]
        ],
        [
          "Qual é o planeta conhecido por seus anéis?",
          "Saturno",
          [
            "Peso argentino",
            "Real",
            "Euro"
          ]
        ],
        [
          "Qual é o animal símbolo da Austrália?",
          "Canguru",
          [
            "Tigre",
            "Girafa",
            "Panda-gigante"
          ]
        ],
        [
          "Qual país é famoso pelas pirâmides de Gizé?",
          "Egito",
          [
            "Dólar",
            "Iene",
            "Peso argentino"
          ]
        ],
        [
          "Qual país abriga a Torre Eiffel?",
          "França",
          [
            "Franco suíço",
            "Peso argentino",
            "Iene"
          ]
        ],
        [
          "Qual cidade abriga o Coliseu?",
          "Roma",
          [
            "Atenas",
            "Veneza",
            "Paris"
          ]
        ],
        [
          "Qual cidade é conhecida pelos canais e gôndolas?",
          "Veneza",
          [
            "Roma",
            "Londres",
            "Paris"
          ]
        ],
        [
          "Qual é o maior órgão interno do corpo humano?",
          "Fígado",
          [
            "Euro",
            "Libra esterlina",
            "Peso argentino"
          ]
        ],
        [
          "Quantos dentes permanentes tem normalmente um adulto?",
          "32",
          [
            "7",
            "60",
            "365"
          ]
        ],
        [
          "Qual é o elemento mais abundante no Universo?",
          "Hidrogênio",
          [
            "Ferro",
            "Alumínio",
            "Hélio"
          ]
        ],
        [
          "Qual é a montanha mais alta do Brasil?",
          "Pico da Neblina",
          [
            "Euro",
            "Franco suíço",
            "Iene"
          ]
        ],
        [
          "Qual é o maior país da América do Sul em área?",
          "Brasil",
          [
            "Dólar",
            "Peso argentino",
            "Real"
          ]
        ],
        [
          "Qual é o menor número primo?",
          "2",
          [
            "Iene",
            "Real",
            "Dólar"
          ]
        ],
        [
          "Qual é o único número primo par?",
          "2",
          [
            "Dólar",
            "Franco suíço",
            "Euro"
          ]
        ],
        [
          "Qual forma geométrica tem quatro lados iguais e quatro ângulos retos?",
          "Quadrado",
          [
            "Real",
            "Dólar",
            "Libra esterlina"
          ]
        ],
        [
          "Qual mês tem menos dias em anos comuns?",
          "Fevereiro",
          [
            "Dólar",
            "Real",
            "Euro"
          ]
        ],
        [
          "Qual é o nome do instrumento que indica direção pelo norte magnético?",
          "Bússola",
          [
            "Real",
            "Euro",
            "Libra esterlina"
          ]
        ],
        [
          "Qual é o nome da ciência que estuda mapas?",
          "Cartografia",
          [
            "Euro",
            "Iene",
            "Peso argentino"
          ]
        ],
        [
          "Qual idioma era falado no antigo Império Romano?",
          "Latim",
          [
            "Francês",
            "Mandarim",
            "Português"
          ]
        ],
        [
          "Qual país é conhecido pelo tango?",
          "Argentina",
          [
            "Franco suíço",
            "Iene",
            "Peso argentino"
          ]
        ],
        [
          "Qual país é associado ao sushi?",
          "Japão",
          [
            "Dólar",
            "Libra esterlina",
            "Real"
          ]
        ],
        [
          "Qual país é associado às tulipas e moinhos?",
          "Países Baixos",
          [
            "Dólar",
            "Peso argentino",
            "Real"
          ]
        ],
        [
          "Qual animal produz lã tradicionalmente usada em tecidos?",
          "Ovelha",
          [
            "Canguru",
            "Panda-gigante",
            "Girafa"
          ]
        ],
        [
          "Qual é o principal ingrediente do vidro comum?",
          "Areia de sílica",
          [
            "Franco suíço",
            "Real",
            "Libra esterlina"
          ]
        ]
      ]
    },
    {
      "slug": "natureza-e-meio-ambiente",
      "questions": [
        [
          "Qual processo permite às plantas produzir alimento?",
          "Fotossíntese",
          [
            "Compostagem",
            "Reciclagem",
            "Evaporação"
          ]
        ],
        [
          "Qual gás é mais associado ao aquecimento global causado por atividades humanas?",
          "Dióxido de carbono",
          [
            "Precipitação",
            "Desmatamento",
            "Reciclagem"
          ]
        ],
        [
          "O que significa reciclar?",
          "Transformar resíduos em novos materiais",
          [
            "Reciclagem",
            "Desmatamento",
            "Evaporação"
          ]
        ],
        [
          "Qual bioma ocupa grande parte do Norte do Brasil?",
          "Amazônia",
          [
            "Caatinga",
            "Pantanal",
            "Pampa"
          ]
        ],
        [
          "Qual fonte de energia é renovável?",
          "Solar",
          [
            "Biomassa",
            "Eólica",
            "Geotérmica"
          ]
        ],
        [
          "Como se chama a variedade de seres vivos?",
          "Biodiversidade",
          [
            "Precipitação",
            "Reciclagem",
            "Condensação"
          ]
        ],
        [
          "Qual animal é importante polinizador?",
          "Abelha",
          [
            "Reciclagem",
            "Precipitação",
            "Evaporação"
          ]
        ],
        [
          "O desmatamento remove principalmente o quê?",
          "Vegetação nativa",
          [
            "Compostagem",
            "Condensação",
            "Reciclagem"
          ]
        ],
        [
          "Qual atitude economiza água?",
          "Fechar a torneira ao escovar os dentes",
          [
            "Precipitação",
            "Fotossíntese",
            "Reciclagem"
          ]
        ],
        [
          "Onde vivem animais e plantas de uma espécie?",
          "Habitat",
          [
            "Extinta",
            "Endêmica",
            "Nativa"
          ]
        ],
        [
          "Qual camada de gases envolve a Terra?",
          "Atmosfera",
          [
            "Troposfera",
            "Estratosfera",
            "Camada de ozônio"
          ]
        ],
        [
          "Qual ciclo natural envolve evaporação, condensação e precipitação?",
          "Ciclo da água",
          [
            "Condensação",
            "Fotossíntese",
            "Desmatamento"
          ]
        ],
        [
          "Como se chama a água que cai das nuvens?",
          "Precipitação",
          [
            "Desmatamento",
            "Condensação",
            "Fotossíntese"
          ]
        ],
        [
          "Qual processo transforma restos orgânicos em adubo?",
          "Compostagem",
          [
            "Evaporação",
            "Precipitação",
            "Fotossíntese"
          ]
        ],
        [
          "Qual material costuma levar séculos para se decompor?",
          "Plástico",
          [
            "Condensação",
            "Reciclagem",
            "Fotossíntese"
          ]
        ],
        [
          "Qual dos três Rs significa diminuir o consumo?",
          "Reduzir",
          [
            "Precipitação",
            "Fotossíntese",
            "Compostagem"
          ]
        ],
        [
          "Qual dos três Rs significa usar novamente?",
          "Reutilizar",
          [
            "Condensação",
            "Fotossíntese",
            "Reciclagem"
          ]
        ],
        [
          "Qual dos três Rs significa transformar resíduos?",
          "Reciclar",
          [
            "Fotossíntese",
            "Reciclagem",
            "Condensação"
          ]
        ],
        [
          "Qual fonte renovável usa a força dos ventos?",
          "Eólica",
          [
            "Geotérmica",
            "Hidrelétrica",
            "Solar"
          ]
        ],
        [
          "Qual fonte renovável usa o movimento da água?",
          "Hidrelétrica",
          [
            "Solar",
            "Biomassa",
            "Geotérmica"
          ]
        ],
        [
          "Qual combustível fóssil é líquido?",
          "Petróleo",
          [
            "Urânio",
            "Carvão mineral",
            "Gás natural"
          ]
        ],
        [
          "Qual combustível fóssil é sólido?",
          "Carvão mineral",
          [
            "Urânio",
            "Petróleo",
            "Gás natural"
          ]
        ],
        [
          "Qual fenômeno ocorre quando nutrientes excessivos reduzem o oxigênio da água?",
          "Eutrofização",
          [
            "Fotossíntese",
            "Condensação",
            "Reciclagem"
          ]
        ],
        [
          "Como se chama a introdução de substâncias nocivas no ambiente?",
          "Poluição",
          [
            "Evaporação",
            "Condensação",
            "Compostagem"
          ]
        ],
        [
          "Qual tipo de poluição é causada por sons excessivos?",
          "Sonora",
          [
            "Evaporação",
            "Desmatamento",
            "Condensação"
          ]
        ],
        [
          "Qual tipo de poluição prejudica a visão do céu noturno?",
          "Luminosa",
          [
            "Fotossíntese",
            "Desmatamento",
            "Precipitação"
          ]
        ],
        [
          "Qual gás protege a Terra de parte da radiação ultravioleta?",
          "Ozônio",
          [
            "Reciclagem",
            "Precipitação",
            "Evaporação"
          ]
        ],
        [
          "Em qual camada atmosférica está a camada de ozônio?",
          "Estratosfera",
          [
            "Atmosfera",
            "Camada de ozônio",
            "Troposfera"
          ]
        ],
        [
          "Qual bioma brasileiro é conhecido por vegetação adaptada à seca?",
          "Caatinga",
          [
            "Mata Atlântica",
            "Amazônia",
            "Cerrado"
          ]
        ],
        [
          "Qual bioma brasileiro é a maior planície alagável?",
          "Pantanal",
          [
            "Caatinga",
            "Mata Atlântica",
            "Amazônia"
          ]
        ],
        [
          "Qual bioma brasileiro possui campos no extremo Sul?",
          "Pampa",
          [
            "Amazônia",
            "Manguezal",
            "Caatinga"
          ]
        ],
        [
          "Qual bioma costeiro possui árvores com raízes adaptadas à lama?",
          "Manguezal",
          [
            "Pampa",
            "Cerrado",
            "Caatinga"
          ]
        ],
        [
          "Qual animal ajuda a dispersar sementes ao comer frutos?",
          "Aves frugívoras",
          [
            "Fotossíntese",
            "Condensação",
            "Evaporação"
          ]
        ],
        [
          "Como se chama uma espécie que existe apenas em determinada região?",
          "Endêmica",
          [
            "Extinta",
            "Invasora",
            "Nativa"
          ]
        ],
        [
          "Como se chama uma espécie introduzida que causa desequilíbrio?",
          "Invasora",
          [
            "Endêmica",
            "Extinta",
            "Nativa"
          ]
        ],
        [
          "Qual é a principal causa da perda de habitat terrestre?",
          "Desmatamento",
          [
            "Precipitação",
            "Compostagem",
            "Fotossíntese"
          ]
        ],
        [
          "O que são áreas protegidas criadas para conservar a natureza?",
          "Unidades de conservação",
          [
            "Evaporação",
            "Desmatamento",
            "Fotossíntese"
          ]
        ],
        [
          "Qual prática agrícola alterna culturas para preservar o solo?",
          "Rotação de culturas",
          [
            "Condensação",
            "Precipitação",
            "Reciclagem"
          ]
        ],
        [
          "Qual técnica protege o solo com restos vegetais?",
          "Cobertura morta",
          [
            "Condensação",
            "Desmatamento",
            "Compostagem"
          ]
        ],
        [
          "Qual fenômeno desgasta o solo pela água ou vento?",
          "Erosão",
          [
            "Reciclagem",
            "Evaporação",
            "Precipitação"
          ]
        ],
        [
          "Qual processo transforma áreas férteis em regiões áridas?",
          "Desertificação",
          [
            "Compostagem",
            "Desmatamento",
            "Evaporação"
          ]
        ],
        [
          "Como se chama o aumento médio da temperatura global?",
          "Aquecimento global",
          [
            "Desmatamento",
            "Precipitação",
            "Fotossíntese"
          ]
        ],
        [
          "Qual fenômeno climático periódico aquece águas do Pacífico equatorial?",
          "El Niño",
          [
            "Desmatamento",
            "Fotossíntese",
            "Compostagem"
          ]
        ],
        [
          "Qual fenômeno climático periódico resfria águas do Pacífico equatorial?",
          "La Niña",
          [
            "Fotossíntese",
            "Precipitação",
            "Evaporação"
          ]
        ],
        [
          "O que é pegada de carbono?",
          "Quantidade de gases de efeito estufa associada a atividades",
          [
            "Condensação",
            "Evaporação",
            "Compostagem"
          ]
        ],
        [
          "Qual atitude reduz resíduos descartáveis?",
          "Usar recipientes reutilizáveis",
          [
            "Desmatamento",
            "Reciclagem",
            "Compostagem"
          ]
        ],
        [
          "Qual atitude reduz consumo de energia elétrica?",
          "Apagar luzes desnecessárias",
          [
            "Biomassa",
            "Geotérmica",
            "Solar"
          ]
        ],
        [
          "Qual transporte tende a emitir menos por pessoa em trajetos urbanos?",
          "Transporte coletivo",
          [
            "Compostagem",
            "Condensação",
            "Evaporação"
          ]
        ],
        [
          "Qual ecossistema marinho é formado por colônias de pequenos animais calcários?",
          "Recife de coral",
          [
            "Desmatamento",
            "Condensação",
            "Fotossíntese"
          ]
        ],
        [
          "Qual grupo de organismos decompõe matéria orgânica?",
          "Fungos e bactérias",
          [
            "Reciclagem",
            "Evaporação",
            "Condensação"
          ]
        ]
      ]
    },
    {
      "slug": "saude-e-bem-estar",
      "questions": [
        [
          "Qual hábito ajuda a prevenir doenças infecciosas?",
          "Lavar as mãos",
          [
            "Manter horários regulares de sono",
            "Evitar tabaco",
            "Praticar atividade física"
          ]
        ],
        [
          "Quantas horas de sono são geralmente recomendadas para adultos?",
          "7 a 9 horas",
          [
            "Manter horários regulares de sono",
            "Evitar tabaco",
            "Beber água"
          ]
        ],
        [
          "Qual nutriente ajuda na construção dos músculos?",
          "Proteína",
          [
            "Carboidrato",
            "Gordura",
            "Ferro"
          ]
        ],
        [
          "Qual atividade beneficia o coração?",
          "Exercício aeróbico",
          [
            "Carboidrato",
            "Fibras",
            "Cálcio"
          ]
        ],
        [
          "O que ajuda a manter a hidratação?",
          "Beber água",
          [
            "Praticar atividade física",
            "Manter horários regulares de sono",
            "Variar grupos alimentares"
          ]
        ],
        [
          "Qual profissional orienta sobre alimentação?",
          "Nutricionista",
          [
            "Médico",
            "Dentista",
            "Fisioterapeuta"
          ]
        ],
        [
          "O protetor solar ajuda a proteger contra quê?",
          "Radiação ultravioleta",
          [
            "Fibras",
            "Gordura",
            "Proteína"
          ]
        ],
        [
          "Qual prática pode reduzir o estresse?",
          "Respiração consciente",
          [
            "Ferro",
            "Cálcio",
            "Gordura"
          ]
        ],
        [
          "Por que vacinas são importantes?",
          "Treinam o sistema imunológico",
          [
            "Proteína",
            "Carboidrato",
            "Ferro"
          ]
        ],
        [
          "Qual postura é melhor ao usar o computador?",
          "Coluna apoiada e tela na altura dos olhos",
          [
            "Cálcio",
            "Gordura",
            "Ferro"
          ]
        ],
        [
          "Qual mineral é importante para ossos e dentes?",
          "Cálcio",
          [
            "Proteína",
            "Gordura",
            "Fibras"
          ]
        ],
        [
          "Qual nutriente é principal fonte rápida de energia?",
          "Carboidrato",
          [
            "Gordura",
            "Proteína",
            "Fibras"
          ]
        ],
        [
          "Qual nutriente ajuda na absorção de vitaminas A, D, E e K?",
          "Gordura",
          [
            "Proteína",
            "Ferro",
            "Fibras"
          ]
        ],
        [
          "Qual vitamina é abundante em frutas cítricas?",
          "Vitamina C",
          [
            "Vitamina D",
            "Vitamina B12",
            "Vitamina K"
          ]
        ],
        [
          "Qual vitamina é importante para a visão?",
          "Vitamina A",
          [
            "Vitamina K",
            "Vitamina C",
            "Vitamina B12"
          ]
        ],
        [
          "Qual mineral transportado pela hemoglobina ajuda a prevenir anemia?",
          "Ferro",
          [
            "Proteína",
            "Carboidrato",
            "Cálcio"
          ]
        ],
        [
          "Qual hábito ajuda a saúde bucal?",
          "Escovar os dentes",
          [
            "Evitar tabaco",
            "Variar grupos alimentares",
            "Praticar atividade física"
          ]
        ],
        [
          "Quantas vezes ao dia é comum recomendar escovação dental?",
          "Pelo menos 2 vezes",
          [
            "Fibras",
            "Ferro",
            "Carboidrato"
          ]
        ],
        [
          "Qual profissional cuida da saúde dos dentes?",
          "Dentista",
          [
            "Nutricionista",
            "Médico",
            "Fisioterapeuta"
          ]
        ],
        [
          "Qual profissional diagnostica e trata doenças em geral?",
          "Médico",
          [
            "Psicólogo",
            "Nutricionista",
            "Enfermeiro"
          ]
        ],
        [
          "Qual profissional trabalha com movimento e reabilitação física?",
          "Fisioterapeuta",
          [
            "Enfermeiro",
            "Nutricionista",
            "Dentista"
          ]
        ],
        [
          "Qual profissional cuida da saúde mental por meio de psicoterapia?",
          "Psicólogo",
          [
            "Fisioterapeuta",
            "Médico",
            "Nutricionista"
          ]
        ],
        [
          "Qual medida simples ajuda a evitar desidratação no calor?",
          "Beber água regularmente",
          [
            "Gordura",
            "Carboidrato",
            "Proteína"
          ]
        ],
        [
          "Qual é um sinal comum de desidratação?",
          "Urina escura",
          [
            "Proteína",
            "Cálcio",
            "Fibras"
          ]
        ],
        [
          "Qual hábito favorece uma alimentação equilibrada?",
          "Variar grupos alimentares",
          [
            "Evitar tabaco",
            "Praticar atividade física",
            "Beber água"
          ]
        ],
        [
          "Qual tipo de alimento deve ser consumido com moderação por excesso de sódio?",
          "Ultraprocessados",
          [
            "Proteína",
            "Ferro",
            "Carboidrato"
          ]
        ],
        [
          "Qual substância do cigarro causa dependência?",
          "Nicotina",
          [
            "Álcool",
            "Sódio",
            "Cafeína"
          ]
        ],
        [
          "Qual órgão é mais diretamente prejudicado pelo tabagismo?",
          "Pulmão",
          [
            "Fibras",
            "Cálcio",
            "Carboidrato"
          ]
        ],
        [
          "Qual hábito reduz risco cardiovascular?",
          "Praticar atividade física",
          [
            "Beber água",
            "Evitar tabaco",
            "Manter horários regulares de sono"
          ]
        ],
        [
          "Qual exercício melhora flexibilidade?",
          "Alongamento",
          [
            "Proteína",
            "Ferro",
            "Cálcio"
          ]
        ],
        [
          "Qual exercício fortalece músculos usando resistência?",
          "Musculação",
          [
            "Carboidrato",
            "Proteína",
            "Cálcio"
          ]
        ],
        [
          "Qual prática ajuda a regular o relógio biológico?",
          "Manter horários regulares de sono",
          [
            "Beber água",
            "Praticar atividade física",
            "Variar grupos alimentares"
          ]
        ],
        [
          "Qual bebida pode atrapalhar o sono quando consumida à noite?",
          "Café",
          [
            "Manter horários regulares de sono",
            "Variar grupos alimentares",
            "Beber água"
          ]
        ],
        [
          "O que significa higiene do sono?",
          "Hábitos que favorecem sono de qualidade",
          [
            "Beber água",
            "Praticar atividade física",
            "Manter horários regulares de sono"
          ]
        ],
        [
          "Qual atitude ajuda a prevenir lesões no exercício?",
          "Aquecer-se adequadamente",
          [
            "Proteína",
            "Gordura",
            "Fibras"
          ]
        ],
        [
          "Qual atitude é correta diante de dor intensa súbita?",
          "Buscar avaliação profissional",
          [
            "Proteína",
            "Gordura",
            "Ferro"
          ]
        ],
        [
          "Qual exame mede pressão arterial?",
          "Esfigmomanometria",
          [
            "Proteína",
            "Gordura",
            "Cálcio"
          ]
        ],
        [
          "Qual valor é chamado de pressão sistólica?",
          "Pressão durante a contração do coração",
          [
            "Ferro",
            "Carboidrato",
            "Cálcio"
          ]
        ],
        [
          "Qual sistema protege o corpo contra agentes infecciosos?",
          "Sistema imunológico",
          [
            "Carboidrato",
            "Proteína",
            "Cálcio"
          ]
        ],
        [
          "Qual célula transporta oxigênio no sangue?",
          "Hemácia",
          [
            "Carboidrato",
            "Cálcio",
            "Proteína"
          ]
        ],
        [
          "Qual hábito ajuda a controlar o estresse?",
          "Organizar pausas e descanso",
          [
            "Praticar atividade física",
            "Beber água",
            "Evitar tabaco"
          ]
        ],
        [
          "Qual técnica envolve atenção ao momento presente?",
          "Mindfulness",
          [
            "Carboidrato",
            "Ferro",
            "Fibras"
          ]
        ],
        [
          "Qual atitude favorece bem-estar social?",
          "Manter vínculos saudáveis",
          [
            "Ferro",
            "Carboidrato",
            "Proteína"
          ]
        ],
        [
          "Qual é a função principal das vacinas?",
          "Prevenir doenças específicas",
          [
            "Ferro",
            "Proteína",
            "Cálcio"
          ]
        ],
        [
          "Qual medida previne infecções transmitidas por alimentos?",
          "Cozinhar e armazenar corretamente",
          [
            "Ferro",
            "Gordura",
            "Cálcio"
          ]
        ],
        [
          "Qual hábito reduz risco de quedas em casa?",
          "Manter passagens iluminadas e livres",
          [
            "Evitar tabaco",
            "Manter horários regulares de sono",
            "Variar grupos alimentares"
          ]
        ],
        [
          "Qual proteção é indicada em ambientes muito barulhentos?",
          "Protetor auricular",
          [
            "Ferro",
            "Carboidrato",
            "Gordura"
          ]
        ],
        [
          "Qual comportamento protege a visão diante de telas?",
          "Fazer pausas periódicas",
          [
            "Carboidrato",
            "Gordura",
            "Fibras"
          ]
        ],
        [
          "Qual regra sugere olhar 20 segundos para longe a cada 20 minutos?",
          "Regra 20-20-20",
          [
            "Proteína",
            "Gordura",
            "Fibras"
          ]
        ],
        [
          "Qual medida ajuda a prevenir doenças transmitidas por mosquitos?",
          "Eliminar água parada",
          [
            "Fibras",
            "Proteína",
            "Carboidrato"
          ]
        ]
      ]
    },
    {
      "slug": "negocios-e-empreendedorismo",
      "questions": [
        [
          "O que é uma proposta de valor?",
          "Benefício que a empresa entrega ao cliente",
          [
            "Fluxo de caixa",
            "Custo variável",
            "Margem de lucro"
          ]
        ],
        [
          "O que significa público-alvo?",
          "Grupo de clientes que se deseja atender",
          [
            "Receita",
            "Margem de lucro",
            "Fluxo de caixa"
          ]
        ],
        [
          "Para que serve um plano de negócios?",
          "Orientar estratégia e operação",
          [
            "Ponto de equilíbrio",
            "Fluxo de caixa",
            "Custo fixo"
          ]
        ],
        [
          "O que é fluxo de caixa?",
          "Entradas e saídas de dinheiro",
          [
            "Custo variável",
            "Lucro bruto",
            "Custo fixo"
          ]
        ],
        [
          "O que é MVP?",
          "Versão mínima para testar uma ideia",
          [
            "Fluxo de caixa",
            "Ponto de equilíbrio",
            "Lucro bruto"
          ]
        ],
        [
          "Qual indicador mede satisfação por recomendação?",
          "NPS",
          [
            "Custo fixo",
            "Fluxo de caixa",
            "Lucro bruto"
          ]
        ],
        [
          "O que é margem de lucro?",
          "Diferença proporcional entre receita e custos",
          [
            "Lucro bruto",
            "Custo fixo",
            "Ponto de equilíbrio"
          ]
        ],
        [
          "Qual ação ajuda a validar uma ideia?",
          "Entrevistar potenciais clientes",
          [
            "Ponto de equilíbrio",
            "Margem de lucro",
            "Fluxo de caixa"
          ]
        ],
        [
          "O que é networking?",
          "Construção de relações profissionais",
          [
            "Custo fixo",
            "Lucro bruto",
            "Margem de lucro"
          ]
        ],
        [
          "Qual é uma característica de meta SMART?",
          "Ser mensurável",
          [
            "Custo fixo",
            "Receita",
            "Fluxo de caixa"
          ]
        ],
        [
          "O que é receita em uma empresa?",
          "Valor obtido com vendas e serviços",
          [
            "Lucro bruto",
            "Margem de lucro",
            "Custo fixo"
          ]
        ],
        [
          "O que é custo fixo?",
          "Despesa que não varia diretamente com as vendas",
          [
            "Fluxo de caixa",
            "Receita",
            "Margem de lucro"
          ]
        ],
        [
          "O que é custo variável?",
          "Despesa que varia com a produção ou vendas",
          [
            "Fluxo de caixa",
            "Custo variável",
            "Lucro bruto"
          ]
        ],
        [
          "O que é ponto de equilíbrio?",
          "Nível em que receitas cobrem custos",
          [
            "Margem de lucro",
            "Ponto de equilíbrio",
            "Receita"
          ]
        ],
        [
          "O que é lucro bruto?",
          "Receita menos custos diretos",
          [
            "Custo variável",
            "Custo fixo",
            "Ponto de equilíbrio"
          ]
        ],
        [
          "O que é capital de giro?",
          "Recursos para manter operações do dia a dia",
          [
            "Custo fixo",
            "Margem de lucro",
            "Receita"
          ]
        ],
        [
          "O que é mercado consumidor?",
          "Conjunto de compradores potenciais",
          [
            "Margem de lucro",
            "Ponto de equilíbrio",
            "Custo variável"
          ]
        ],
        [
          "O que é concorrência?",
          "Empresas que disputam clientes semelhantes",
          [
            "Custo variável",
            "Ponto de equilíbrio",
            "Lucro bruto"
          ]
        ],
        [
          "O que é posicionamento de marca?",
          "Lugar desejado da marca na mente do público",
          [
            "Branding",
            "Posicionamento",
            "Marketing digital"
          ]
        ],
        [
          "O que é branding?",
          "Gestão da identidade e percepção da marca",
          [
            "Receita",
            "Ponto de equilíbrio",
            "Margem de lucro"
          ]
        ],
        [
          "O que é marketing digital?",
          "Promoção por canais digitais",
          [
            "Marketing digital",
            "Branding",
            "Posicionamento"
          ]
        ],
        [
          "O que é conversão em marketing?",
          "Ação desejada realizada pelo usuário",
          [
            "Proposta de valor",
            "Posicionamento",
            "Branding"
          ]
        ],
        [
          "O que é funil de vendas?",
          "Etapas da jornada até a compra",
          [
            "Fluxo de caixa",
            "Lucro bruto",
            "Margem de lucro"
          ]
        ],
        [
          "O que é lead?",
          "Potencial cliente identificado",
          [
            "Receita",
            "Fluxo de caixa",
            "Margem de lucro"
          ]
        ],
        [
          "O que é ticket médio?",
          "Valor médio das vendas",
          [
            "LTV",
            "Ticket médio",
            "Churn"
          ]
        ],
        [
          "O que é churn?",
          "Taxa de perda de clientes",
          [
            "Custo variável",
            "Fluxo de caixa",
            "Ponto de equilíbrio"
          ]
        ],
        [
          "O que é retenção de clientes?",
          "Capacidade de manter clientes ativos",
          [
            "CAC",
            "Churn",
            "Retenção de clientes"
          ]
        ],
        [
          "O que é feedback do cliente?",
          "Opinião sobre produto ou serviço",
          [
            "Retenção de clientes",
            "LTV",
            "Ticket médio"
          ]
        ],
        [
          "O que é pesquisa de mercado?",
          "Coleta de dados sobre clientes e concorrentes",
          [
            "Lucro bruto",
            "Custo fixo",
            "Custo variável"
          ]
        ],
        [
          "O que é segmentação de mercado?",
          "Divisão do mercado em grupos semelhantes",
          [
            "Margem de lucro",
            "Custo variável",
            "Fluxo de caixa"
          ]
        ],
        [
          "O que é persona?",
          "Perfil semifictício do cliente ideal",
          [
            "Ponto de equilíbrio",
            "Fluxo de caixa",
            "Custo variável"
          ]
        ],
        [
          "O que é diferencial competitivo?",
          "Característica que distingue a empresa",
          [
            "Plano de negócios",
            "Feedback",
            "Diferencial competitivo"
          ]
        ],
        [
          "O que é inovação incremental?",
          "Melhoria gradual em produto ou processo",
          [
            "Diferencial competitivo",
            "Escalabilidade",
            "Plano de negócios"
          ]
        ],
        [
          "O que é escalabilidade?",
          "Capacidade de crescer sem elevar custos na mesma proporção",
          [
            "Inovação incremental",
            "Feedback",
            "Diferencial competitivo"
          ]
        ],
        [
          "O que é franquia empresarial?",
          "Modelo de uso licenciado de marca e operação",
          [
            "Franquia",
            "Sociedade",
            "Licenciamento"
          ]
        ],
        [
          "O que é sociedade empresarial?",
          "Negócio com dois ou mais sócios",
          [
            "Receita",
            "Custo variável",
            "Margem de lucro"
          ]
        ],
        [
          "O que é pró-labore?",
          "Remuneração dos sócios pelo trabalho",
          [
            "Custo fixo",
            "Margem de lucro",
            "Custo variável"
          ]
        ],
        [
          "O que é estoque?",
          "Conjunto de produtos ou materiais armazenados",
          [
            "Custo variável",
            "Receita",
            "Margem de lucro"
          ]
        ],
        [
          "O que é giro de estoque?",
          "Velocidade de renovação do estoque",
          [
            "Custo variável",
            "Lucro bruto",
            "Fluxo de caixa"
          ]
        ],
        [
          "O que é fornecedor?",
          "Empresa ou pessoa que fornece insumos",
          [
            "Receita",
            "Custo variável",
            "Fluxo de caixa"
          ]
        ],
        [
          "O que é negociação ganha-ganha?",
          "Acordo benéfico para as partes",
          [
            "Custo fixo",
            "Lucro bruto",
            "Margem de lucro"
          ]
        ],
        [
          "O que é liderança?",
          "Capacidade de orientar e influenciar pessoas",
          [
            "Ponto de equilíbrio",
            "Custo fixo",
            "Lucro bruto"
          ]
        ],
        [
          "O que é delegação?",
          "Transferência de tarefas com responsabilidade definida",
          [
            "Receita",
            "Ponto de equilíbrio",
            "Custo variável"
          ]
        ],
        [
          "O que é produtividade?",
          "Relação entre resultados e recursos usados",
          [
            "Fluxo de caixa",
            "Custo variável",
            "Lucro bruto"
          ]
        ],
        [
          "O que é KPI?",
          "Indicador-chave de desempenho",
          [
            "Ponto de equilíbrio",
            "Fluxo de caixa",
            "Receita"
          ]
        ],
        [
          "O que é OKR?",
          "Método de objetivos e resultados-chave",
          [
            "Custo variável",
            "Lucro bruto",
            "Ponto de equilíbrio"
          ]
        ],
        [
          "O que é missão empresarial?",
          "Razão de existir da organização",
          [
            "Custo variável",
            "Lucro bruto",
            "Ponto de equilíbrio"
          ]
        ],
        [
          "O que é visão empresarial?",
          "Estado futuro desejado pela organização",
          [
            "Custo fixo",
            "Lucro bruto",
            "Margem de lucro"
          ]
        ],
        [
          "O que são valores empresariais?",
          "Princípios que orientam decisões",
          [
            "Fluxo de caixa",
            "Receita",
            "Custo variável"
          ]
        ],
        [
          "O que é análise SWOT?",
          "Avaliação de forças, fraquezas, oportunidades e ameaças",
          [
            "Receita",
            "Ponto de equilíbrio",
            "Fluxo de caixa"
          ]
        ]
      ]
    },
    {
      "slug": "financas",
      "questions": [
        [
          "O que é orçamento pessoal?",
          "Plano de receitas e despesas",
          [
            "Ativo",
            "Patrimônio",
            "Poupança financeira"
          ]
        ],
        [
          "O que são juros compostos?",
          "Juros sobre capital e juros acumulados",
          [
            "Juros compostos",
            "Amortização",
            "Pagamento mínimo"
          ]
        ],
        [
          "O que é reserva de emergência?",
          "Dinheiro para imprevistos",
          [
            "Ativo",
            "Investimento",
            "Despesa variável"
          ]
        ],
        [
          "Qual é o efeito da inflação?",
          "Reduz o poder de compra",
          [
            "Inflação",
            "Diversificação",
            "Renda fixa"
          ]
        ],
        [
          "O que significa diversificar investimentos?",
          "Distribuir recursos entre ativos",
          [
            "Ativo",
            "Poupança financeira",
            "Despesa fixa"
          ]
        ],
        [
          "Qual dívida costuma ter juros altos?",
          "Rotativo do cartão",
          [
            "Amortização",
            "Capital",
            "Pagamento mínimo"
          ]
        ],
        [
          "O que é liquidez?",
          "Facilidade de converter um ativo em dinheiro",
          [
            "Câmbio",
            "Diversificação",
            "Renda variável"
          ]
        ],
        [
          "Para que serve comparar o CET?",
          "Conhecer o custo total do crédito",
          [
            "Renda líquida",
            "Investimento",
            "Patrimônio"
          ]
        ],
        [
          "Qual atitude melhora o controle financeiro?",
          "Registrar gastos",
          [
            "Orçamento",
            "Ativo",
            "Patrimônio"
          ]
        ],
        [
          "O que é patrimônio líquido pessoal?",
          "Bens menos dívidas",
          [
            "Despesa variável",
            "Patrimônio",
            "Renda líquida"
          ]
        ],
        [
          "O que é renda líquida?",
          "Renda após descontos",
          [
            "Despesa fixa",
            "Despesa variável",
            "Poupança financeira"
          ]
        ],
        [
          "O que é despesa fixa?",
          "Gasto recorrente de valor previsível",
          [
            "Orçamento",
            "Despesa variável",
            "Renda líquida"
          ]
        ],
        [
          "O que é despesa variável?",
          "Gasto que muda conforme o consumo",
          [
            "Despesa variável",
            "Orçamento",
            "Passivo"
          ]
        ],
        [
          "O que é poupança financeira?",
          "Parte da renda não consumida",
          [
            "Poupança financeira",
            "Renda líquida",
            "Despesa variável"
          ]
        ],
        [
          "O que é investimento?",
          "Aplicação de recursos buscando retorno",
          [
            "Patrimônio",
            "Ativo",
            "Despesa variável"
          ]
        ],
        [
          "O que é risco financeiro?",
          "Possibilidade de perda ou retorno diferente do esperado",
          [
            "Ativo",
            "Poupança financeira",
            "Patrimônio"
          ]
        ],
        [
          "O que é rentabilidade?",
          "Retorno obtido sobre o valor investido",
          [
            "Orçamento",
            "Patrimônio",
            "Ativo"
          ]
        ],
        [
          "O que é taxa de juros?",
          "Percentual cobrado ou recebido pelo uso do dinheiro",
          [
            "Juros simples",
            "Capital",
            "Amortização"
          ]
        ],
        [
          "O que são juros simples?",
          "Juros calculados apenas sobre o capital inicial",
          [
            "Limite de crédito",
            "Pagamento mínimo",
            "Juros simples"
          ]
        ],
        [
          "O que é principal de uma dívida?",
          "Valor originalmente tomado emprestado",
          [
            "Amortização",
            "Capital",
            "Fatura"
          ]
        ],
        [
          "O que é parcela?",
          "Pagamento periódico de uma dívida",
          [
            "Despesa variável",
            "Renda líquida",
            "Patrimônio"
          ]
        ],
        [
          "O que é amortização?",
          "Redução do saldo devedor",
          [
            "Passivo",
            "Investimento",
            "Despesa fixa"
          ]
        ],
        [
          "O que é inadimplência?",
          "Falta de pagamento no prazo",
          [
            "Poupança financeira",
            "Ativo",
            "Despesa fixa"
          ]
        ],
        [
          "O que é score de crédito?",
          "Indicador de probabilidade de pagamento",
          [
            "Despesa variável",
            "Renda líquida",
            "Orçamento"
          ]
        ],
        [
          "O que é limite de crédito?",
          "Valor máximo disponibilizado para uso",
          [
            "Juros compostos",
            "Capital",
            "Fatura"
          ]
        ],
        [
          "O que é fatura do cartão?",
          "Resumo das compras e encargos do período",
          [
            "Pagamento mínimo",
            "Capital",
            "Limite de crédito"
          ]
        ],
        [
          "O que é pagamento mínimo do cartão?",
          "Menor valor aceito sem quitar a fatura total",
          [
            "Pix",
            "Transferência bancária",
            "Boleto bancário"
          ]
        ],
        [
          "O que é débito automático?",
          "Pagamento programado em conta",
          [
            "Orçamento",
            "Passivo",
            "Despesa fixa"
          ]
        ],
        [
          "O que é Pix?",
          "Sistema brasileiro de pagamentos instantâneos",
          [
            "Transferência bancária",
            "Pix",
            "Boleto bancário"
          ]
        ],
        [
          "O que é TED?",
          "Transferência eletrônica entre instituições",
          [
            "Despesa variável",
            "Renda líquida",
            "Poupança financeira"
          ]
        ],
        [
          "O que é câmbio?",
          "Troca entre moedas",
          [
            "Renda variável",
            "Inflação",
            "Câmbio"
          ]
        ],
        [
          "O que é taxa de câmbio?",
          "Preço de uma moeda em relação a outra",
          [
            "Renda fixa",
            "Renda variável",
            "Diversificação"
          ]
        ],
        [
          "O que é ativo financeiro?",
          "Recurso com valor econômico",
          [
            "Poupança financeira",
            "Ativo",
            "Despesa fixa"
          ]
        ],
        [
          "O que é passivo financeiro?",
          "Obrigação ou dívida",
          [
            "Poupança financeira",
            "Renda líquida",
            "Passivo"
          ]
        ],
        [
          "O que é patrimônio?",
          "Conjunto de bens, direitos e obrigações",
          [
            "Passivo",
            "Despesa fixa",
            "Despesa variável"
          ]
        ],
        [
          "O que é renda fixa?",
          "Investimento com regras de remuneração definidas",
          [
            "Renda líquida",
            "Orçamento",
            "Despesa variável"
          ]
        ],
        [
          "O que é renda variável?",
          "Investimento cujo retorno não é previamente garantido",
          [
            "Passivo",
            "Despesa fixa",
            "Poupança financeira"
          ]
        ],
        [
          "O que é ação?",
          "Fração do capital de uma empresa",
          [
            "Despesa fixa",
            "Ativo",
            "Despesa variável"
          ]
        ],
        [
          "O que é dividendo?",
          "Parcela do lucro distribuída aos acionistas",
          [
            "Orçamento",
            "Renda líquida",
            "Patrimônio"
          ]
        ],
        [
          "O que é fundo de investimento?",
          "Condomínio que reúne recursos de investidores",
          [
            "Ativo",
            "Patrimônio",
            "Despesa fixa"
          ]
        ],
        [
          "O que é título público?",
          "Dívida emitida pelo governo",
          [
            "Patrimônio",
            "Orçamento",
            "Passivo"
          ]
        ],
        [
          "O que é CDB?",
          "Título emitido por banco para captar recursos",
          [
            "Passivo",
            "Renda líquida",
            "Investimento"
          ]
        ],
        [
          "O que é inflação acumulada?",
          "Variação de preços ao longo de um período",
          [
            "Inflação",
            "Liquidez",
            "Renda variável"
          ]
        ],
        [
          "O que é deflação?",
          "Queda generalizada de preços",
          [
            "Orçamento",
            "Despesa variável",
            "Passivo"
          ]
        ],
        [
          "O que é poder de compra?",
          "Quantidade de bens e serviços que o dinheiro compra",
          [
            "Despesa variável",
            "Ativo",
            "Investimento"
          ]
        ],
        [
          "O que é planejamento financeiro?",
          "Definição de metas e uso dos recursos",
          [
            "Ativo",
            "Renda líquida",
            "Poupança financeira"
          ]
        ],
        [
          "O que é meta financeira?",
          "Objetivo monetário com prazo e valor",
          [
            "Renda líquida",
            "Orçamento",
            "Despesa variável"
          ]
        ],
        [
          "Qual é a primeira etapa de um orçamento?",
          "Registrar receitas e despesas",
          [
            "Investimento",
            "Renda líquida",
            "Despesa variável"
          ]
        ],
        [
          "O que é custo de oportunidade?",
          "Benefício renunciado ao escolher outra opção",
          [
            "Passivo",
            "Investimento",
            "Orçamento"
          ]
        ],
        [
          "O que é solvência?",
          "Capacidade de cumprir obrigações financeiras",
          [
            "Despesa fixa",
            "Poupança financeira",
            "Investimento"
          ]
        ]
      ]
    },
    {
      "slug": "gastronomia",
      "questions": [
        [
          "Qual ingrediente faz o pão crescer?",
          "Fermento",
          [
            "Azeitona",
            "Sal",
            "Chá"
          ]
        ],
        [
          "O que significa cozinhar al dente?",
          "Macio, mas ainda firme",
          [
            "Chá",
            "Sal",
            "Café"
          ]
        ],
        [
          "Qual é a base tradicional do guacamole?",
          "Abacate",
          [
            "Azeitona",
            "Farinha de trigo",
            "Chá"
          ]
        ],
        [
          "Qual utensílio mede a temperatura do alimento?",
          "Termômetro culinário",
          [
            "Sal",
            "Café",
            "Farinha de trigo"
          ]
        ],
        [
          "Qual prato brasileiro leva feijão-preto e carnes?",
          "Feijoada",
          [
            "Sushi",
            "Taco",
            "Gazpacho"
          ]
        ],
        [
          "O que é banho-maria?",
          "Aquecimento indireto em água",
          [
            "Azeitona",
            "Chá",
            "Sal"
          ]
        ],
        [
          "Qual erva é base do pesto genovês?",
          "Manjericão",
          [
            "Farinha de trigo",
            "Café",
            "Chá"
          ]
        ],
        [
          "Qual técnica cozinha com vapor?",
          "Vaporização",
          [
            "Emulsionar",
            "Assar",
            "Caramelizar"
          ]
        ],
        [
          "Qual ingrediente dá estrutura ao merengue?",
          "Clara de ovo",
          [
            "Azeite",
            "Café",
            "Chá"
          ]
        ],
        [
          "Para evitar contaminação cruzada, o que fazer?",
          "Separar alimentos crus dos prontos",
          [
            "Sal",
            "Café",
            "Farinha de trigo"
          ]
        ],
        [
          "Qual ingrediente principal forma a massa de macarrão tradicional?",
          "Farinha de trigo",
          [
            "Azeitona",
            "Fubá de milho",
            "Azeite"
          ]
        ],
        [
          "Qual ingrediente dá sabor salgado aos alimentos?",
          "Sal",
          [
            "Chá",
            "Fubá de milho",
            "Café"
          ]
        ],
        [
          "Qual técnica cozinha alimentos em água fervente?",
          "Cozimento",
          [
            "Saltear",
            "Marinar",
            "Caramelizar"
          ]
        ],
        [
          "Qual técnica usa calor seco dentro do forno?",
          "Assar",
          [
            "Emulsionar",
            "Caramelizar",
            "Marinar"
          ]
        ],
        [
          "Qual técnica cozinha rapidamente em pouca gordura?",
          "Saltear",
          [
            "Caramelizar",
            "Fermentação láctica",
            "Cozimento"
          ]
        ],
        [
          "Qual técnica cozinha diretamente sobre uma grelha?",
          "Grelhar",
          [
            "Caramelizar",
            "Fermentação láctica",
            "Assar"
          ]
        ],
        [
          "Qual técnica mergulha o alimento em óleo quente?",
          "Fritura por imersão",
          [
            "Fermentação láctica",
            "Caramelizar",
            "Assar"
          ]
        ],
        [
          "O que é marinar?",
          "Deixar o alimento em líquido temperado",
          [
            "Fubá de milho",
            "Azeite",
            "Café"
          ]
        ],
        [
          "O que é caramelizar?",
          "Aquecer açúcar até mudar cor e sabor",
          [
            "Azeitona",
            "Fubá de milho",
            "Sal"
          ]
        ],
        [
          "O que é emulsão?",
          "Mistura estável de líquidos que normalmente não se combinam",
          [
            "Fubá de milho",
            "Sal",
            "Café"
          ]
        ],
        [
          "Qual molho francês combina gema e manteiga?",
          "Holandês",
          [
            "Maionese",
            "Tomate",
            "Béchamel"
          ]
        ],
        [
          "Qual molho tem leite, manteiga e farinha como base?",
          "Béchamel",
          [
            "Maionese",
            "Holandês",
            "Pesto"
          ]
        ],
        [
          "Qual prato italiano é feito com arroz cremoso?",
          "Risoto",
          [
            "Paella",
            "Sushi",
            "Crème brûlée"
          ]
        ],
        [
          "Qual prato japonês usa arroz temperado e peixe ou vegetais?",
          "Sushi",
          [
            "Risoto",
            "Paella",
            "Taco"
          ]
        ],
        [
          "Qual prato mexicano usa tortilla dobrada com recheio?",
          "Taco",
          [
            "Paella",
            "Gazpacho",
            "Crème brûlée"
          ]
        ],
        [
          "Qual prato espanhol combina arroz e frutos do mar ou carnes?",
          "Paella",
          [
            "Taco",
            "Sushi",
            "Tiramisù"
          ]
        ],
        [
          "Qual sopa fria espanhola leva tomate?",
          "Gazpacho",
          [
            "Tiramisù",
            "Taco",
            "Sushi"
          ]
        ],
        [
          "Qual sobremesa italiana leva café e mascarpone?",
          "Tiramisù",
          [
            "Risoto",
            "Gazpacho",
            "Taco"
          ]
        ],
        [
          "Qual sobremesa francesa tem cobertura de açúcar queimado?",
          "Crème brûlée",
          [
            "Gazpacho",
            "Taco",
            "Risoto"
          ]
        ],
        [
          "Qual doce brasileiro é feito com leite condensado e chocolate?",
          "Brigadeiro",
          [
            "Fubá de milho",
            "Azeitona",
            "Chá"
          ]
        ],
        [
          "Qual ingrediente principal da tapioca?",
          "Goma de mandioca",
          [
            "Chá",
            "Café",
            "Fubá de milho"
          ]
        ],
        [
          "Qual ingrediente principal da polenta?",
          "Fubá de milho",
          [
            "Chá",
            "Farinha de trigo",
            "Café"
          ]
        ],
        [
          "Qual fruto é usado para produzir azeite?",
          "Azeitona",
          [
            "Café",
            "Azeite",
            "Chá"
          ]
        ],
        [
          "Qual bebida é produzida pela infusão de folhas de Camellia sinensis?",
          "Chá",
          [
            "Farinha de trigo",
            "Fubá de milho",
            "Azeitona"
          ]
        ],
        [
          "Qual bebida é produzida com grãos torrados e moídos?",
          "Café",
          [
            "Azeite",
            "Farinha de trigo",
            "Chá"
          ]
        ],
        [
          "Qual fermentação produz iogurte?",
          "Fermentação láctica",
          [
            "Emulsionar",
            "Assar",
            "Saltear"
          ]
        ],
        [
          "Qual ingrediente ajuda a engrossar molhos por gelatinização?",
          "Amido",
          [
            "Farinha de trigo",
            "Sal",
            "Azeite"
          ]
        ],
        [
          "Qual corte transforma alimentos em cubos pequenos e regulares?",
          "Brunoise",
          [
            "Fubá de milho",
            "Farinha de trigo",
            "Chá"
          ]
        ],
        [
          "Qual corte produz tiras finas?",
          "Julienne",
          [
            "Sal",
            "Azeite",
            "Café"
          ]
        ],
        [
          "O que significa peneirar farinha?",
          "Passá-la por uma peneira",
          [
            "Sal",
            "Chá",
            "Azeitona"
          ]
        ],
        [
          "O que é pré-aquecer o forno?",
          "Aquecer antes de colocar o alimento",
          [
            "Café",
            "Sal",
            "Chá"
          ]
        ],
        [
          "Qual equipamento conserva alimentos em baixa temperatura?",
          "Geladeira",
          [
            "Sal",
            "Chá",
            "Azeitona"
          ]
        ],
        [
          "Qual temperatura é inferior à de refrigeração e conserva por mais tempo?",
          "Congelamento",
          [
            "Azeitona",
            "Azeite",
            "Fubá de milho"
          ]
        ],
        [
          "Qual prática reduz risco de intoxicação alimentar?",
          "Higienizar mãos e utensílios",
          [
            "Chá",
            "Sal",
            "Azeitona"
          ]
        ],
        [
          "Qual alimento cru exige cuidado especial por risco de Salmonella?",
          "Ovo",
          [
            "Café",
            "Sal",
            "Farinha de trigo"
          ]
        ],
        [
          "Qual utensílio é usado para bater claras?",
          "Batedor de arame",
          [
            "Azeite",
            "Farinha de trigo",
            "Fubá de milho"
          ]
        ],
        [
          "Qual utensílio serve para escorrer massas?",
          "Escorredor",
          [
            "Azeitona",
            "Fubá de milho",
            "Azeite"
          ]
        ],
        [
          "Qual utensílio remove a casca fina de legumes?",
          "Descascador",
          [
            "Fubá de milho",
            "Azeite",
            "Sal"
          ]
        ],
        [
          "Qual técnica usa fumaça para dar sabor e conservar?",
          "Defumação",
          [
            "Caramelizar",
            "Fermentação láctica",
            "Assar"
          ]
        ],
        [
          "Qual sabor básico está associado ao glutamato?",
          "Umami",
          [
            "Fubá de milho",
            "Farinha de trigo",
            "Café"
          ]
        ]
      ]
    },
    {
      "slug": "viagens",
      "questions": [
        [
          "Qual documento é geralmente exigido em viagens internacionais?",
          "Passaporte",
          [
            "Visto",
            "Seguro viagem",
            "Certificado internacional de vacinação"
          ]
        ],
        [
          "O que é check-in?",
          "Confirmação de entrada ou embarque",
          [
            "Check-in",
            "Portão de embarque",
            "Desembarque"
          ]
        ],
        [
          "Qual item não deve ir solto na bagagem de mão?",
          "Líquido acima do limite permitido",
          [
            "Bagagem despachada",
            "Bagagem de mão",
            "Excesso de bagagem"
          ]
        ],
        [
          "O que é fuso horário?",
          "Diferença de hora entre regiões",
          [
            "Embarque",
            "Check-in",
            "Portão de embarque"
          ]
        ],
        [
          "Para que serve um seguro viagem?",
          "Cobrir imprevistos previstos na apólice",
          [
            "Portão de embarque",
            "Check-in",
            "Cartão de embarque"
          ]
        ],
        [
          "Qual aplicativo ou recurso ajuda na navegação?",
          "Mapa offline",
          [
            "Check-in",
            "Desembarque",
            "Embarque"
          ]
        ],
        [
          "O que significa meia pensão em um hotel?",
          "Duas refeições incluídas",
          [
            "Cartão de embarque",
            "Desembarque",
            "Conexão"
          ]
        ],
        [
          "Qual atitude respeita a cultura local?",
          "Conhecer costumes e regras",
          [
            "Conexão",
            "Portão de embarque",
            "Embarque"
          ]
        ],
        [
          "O que é conexão aérea?",
          "Troca de voo antes do destino final",
          [
            "Embarque",
            "Escala aérea",
            "Cartão de embarque"
          ]
        ],
        [
          "Qual informação conferir antes de sair?",
          "Validade dos documentos",
          [
            "Escala aérea",
            "Desembarque",
            "Check-in"
          ]
        ],
        [
          "O que é embarque?",
          "Entrada no meio de transporte",
          [
            "Escala aérea",
            "Check-in",
            "Conexão"
          ]
        ],
        [
          "O que é desembarque?",
          "Saída do meio de transporte",
          [
            "Check-in",
            "Cartão de embarque",
            "Escala aérea"
          ]
        ],
        [
          "O que é cartão de embarque?",
          "Documento que autoriza o acesso ao voo",
          [
            "Portão de embarque",
            "Desembarque",
            "Escala aérea"
          ]
        ],
        [
          "O que é portão de embarque?",
          "Local de acesso à aeronave",
          [
            "Cartão de embarque",
            "Conexão",
            "Escala aérea"
          ]
        ],
        [
          "O que é escala aérea?",
          "Parada do voo antes do destino",
          [
            "Escala aérea",
            "Desembarque",
            "Portão de embarque"
          ]
        ],
        [
          "O que é voo direto?",
          "Voo com mesmo número até o destino, podendo ter parada",
          [
            "Portão de embarque",
            "Desembarque",
            "Escala aérea"
          ]
        ],
        [
          "O que é voo sem escala?",
          "Voo sem pousos intermediários",
          [
            "Cartão de embarque",
            "Conexão",
            "Check-in"
          ]
        ],
        [
          "O que é bagagem despachada?",
          "Mala transportada no porão",
          [
            "Franquia de bagagem",
            "Bagagem despachada",
            "Bagagem de mão"
          ]
        ],
        [
          "O que é bagagem de mão?",
          "Bagagem levada na cabine",
          [
            "Excesso de bagagem",
            "Bagagem despachada",
            "Franquia de bagagem"
          ]
        ],
        [
          "O que é franquia de bagagem?",
          "Limite incluído de peso ou volumes",
          [
            "Excesso de bagagem",
            "Bagagem despachada",
            "Franquia de bagagem"
          ]
        ],
        [
          "O que é excesso de bagagem?",
          "Peso ou volume acima do permitido",
          [
            "Franquia de bagagem",
            "Bagagem despachada",
            "Excesso de bagagem"
          ]
        ],
        [
          "O que é alfândega?",
          "Fiscalização de entrada e saída de bens",
          [
            "Imigração",
            "Alfândega",
            "Câmbio"
          ]
        ],
        [
          "O que é imigração?",
          "Controle de entrada e saída de pessoas",
          [
            "Alfândega",
            "Imigração",
            "Câmbio"
          ]
        ],
        [
          "O que é visto de viagem?",
          "Autorização de entrada concedida por um país",
          [
            "Passaporte",
            "Visto",
            "Certificado internacional de vacinação"
          ]
        ],
        [
          "O que é vacina exigida para viagem?",
          "Comprovante sanitário conforme destino",
          [
            "Visto",
            "Certificado internacional de vacinação",
            "Seguro viagem"
          ]
        ],
        [
          "O que é câmbio de moeda?",
          "Troca de uma moeda por outra",
          [
            "Imigração",
            "Alfândega",
            "Câmbio"
          ]
        ],
        [
          "O que é hostel?",
          "Hospedagem geralmente econômica e compartilhada",
          [
            "Escala aérea",
            "Conexão",
            "Check-in"
          ]
        ],
        [
          "O que é pousada?",
          "Hospedagem de pequeno porte",
          [
            "Escala aérea",
            "Embarque",
            "Cartão de embarque"
          ]
        ],
        [
          "O que é resort?",
          "Complexo de hospedagem com lazer e serviços",
          [
            "Cartão de embarque",
            "Escala aérea",
            "Desembarque"
          ]
        ],
        [
          "O que significa pensão completa?",
          "Três refeições principais incluídas",
          [
            "Check-in",
            "Embarque",
            "Conexão"
          ]
        ],
        [
          "O que significa all inclusive?",
          "Hospedagem com ampla oferta de refeições e bebidas incluídas",
          [
            "Portão de embarque",
            "Desembarque",
            "Check-in"
          ]
        ],
        [
          "O que é tarifa reembolsável?",
          "Reserva que permite devolução conforme regras",
          [
            "Check-in",
            "Conexão",
            "Escala aérea"
          ]
        ],
        [
          "O que é no-show?",
          "Não comparecimento à reserva",
          [
            "Desembarque",
            "Cartão de embarque",
            "Check-in"
          ]
        ],
        [
          "O que é overbooking?",
          "Venda de reservas acima da capacidade",
          [
            "Portão de embarque",
            "Desembarque",
            "Cartão de embarque"
          ]
        ],
        [
          "O que é voucher?",
          "Comprovante de reserva ou serviço",
          [
            "Conexão",
            "Escala aérea",
            "Check-in"
          ]
        ],
        [
          "O que é roteiro de viagem?",
          "Planejamento de locais e atividades",
          [
            "Embarque",
            "Portão de embarque",
            "Escala aérea"
          ]
        ],
        [
          "O que é atração turística?",
          "Lugar ou atividade de interesse ao visitante",
          [
            "Check-in",
            "Escala aérea",
            "Conexão"
          ]
        ],
        [
          "O que é guia turístico?",
          "Profissional que orienta visitantes",
          [
            "Conexão",
            "Cartão de embarque",
            "Escala aérea"
          ]
        ],
        [
          "O que é turismo sustentável?",
          "Viagem que reduz impactos e beneficia comunidades",
          [
            "Desembarque",
            "Cartão de embarque",
            "Conexão"
          ]
        ],
        [
          "O que é ecoturismo?",
          "Turismo voltado à natureza e conservação",
          [
            "Portão de embarque",
            "Conexão",
            "Cartão de embarque"
          ]
        ],
        [
          "O que é jet lag?",
          "Desajuste do relógio biológico por fusos",
          [
            "Embarque",
            "Desembarque",
            "Escala aérea"
          ]
        ],
        [
          "Qual item ajuda em tomadas de padrões diferentes?",
          "Adaptador universal",
          [
            "Escala aérea",
            "Cartão de embarque",
            "Portão de embarque"
          ]
        ],
        [
          "Qual recurso permite comunicação móvel no exterior?",
          "Roaming internacional",
          [
            "Escala aérea",
            "Cartão de embarque",
            "Portão de embarque"
          ]
        ],
        [
          "O que é eSIM de viagem?",
          "Chip digital para conexão móvel",
          [
            "Check-in",
            "Escala aérea",
            "Desembarque"
          ]
        ],
        [
          "Qual documento comprova cobertura médica contratada?",
          "Apólice de seguro viagem",
          [
            "Check-in",
            "Portão de embarque",
            "Embarque"
          ]
        ],
        [
          "Qual cuidado é importante com documentos?",
          "Guardar cópias digitais seguras",
          [
            "Desembarque",
            "Embarque",
            "Escala aérea"
          ]
        ],
        [
          "Qual cuidado ajuda a evitar golpes turísticos?",
          "Pesquisar prestadores e preços",
          [
            "Cartão de embarque",
            "Embarque",
            "Escala aérea"
          ]
        ],
        [
          "Qual atitude protege objetos em locais movimentados?",
          "Manter pertences próximos e fechados",
          [
            "Conexão",
            "Embarque",
            "Escala aérea"
          ]
        ],
        [
          "Qual informação deve ser conferida na reserva de hotel?",
          "Datas de entrada e saída",
          [
            "No-show",
            "Reserva reembolsável",
            "Overbooking"
          ]
        ],
        [
          "Qual informação deve ser conferida na passagem aérea?",
          "Nome conforme o documento",
          [
            "Escala aérea",
            "Cartão de embarque",
            "Portão de embarque"
          ]
        ]
      ]
    },
    {
      "slug": "curiosidades",
      "questions": [
        [
          "Qual animal tem três corações?",
          "Polvo",
          [
            "Camaleão",
            "Avestruz",
            "Morcego"
          ]
        ],
        [
          "Qual é o único mamífero capaz de voo sustentado?",
          "Morcego",
          [
            "Guepardo",
            "Avestruz",
            "Baleia-azul"
          ]
        ],
        [
          "Qual planeta gira quase de lado?",
          "Urano",
          [
            "Saturno",
            "Júpiter",
            "Marte"
          ]
        ],
        [
          "Qual alimento pode durar muitos anos quando bem armazenado?",
          "Mel",
          [
            "Morcego",
            "Avestruz",
            "Polvo"
          ]
        ],
        [
          "Quantos braços tem uma estrela-do-mar típica?",
          "5",
          [
            "Guepardo",
            "Elefante",
            "Baleia-azul"
          ]
        ],
        [
          "Qual parte do corpo humano não possui vasos sanguíneos?",
          "Córnea",
          [
            "Morcego",
            "Polvo",
            "Girafa"
          ]
        ],
        [
          "Qual país tem mais ilhas catalogadas?",
          "Suécia",
          [
            "Ornitorrinco",
            "Morcego",
            "Elefante"
          ]
        ],
        [
          "Qual ave consegue voar para trás?",
          "Beija-flor",
          [
            "Polvo",
            "Elefante",
            "Ornitorrinco"
          ]
        ],
        [
          "Qual é o menor osso do corpo humano?",
          "Estribo",
          [
            "Elefante",
            "Polvo",
            "Ornitorrinco"
          ]
        ],
        [
          "Que cor a pele de um urso-polar tem sob os pelos?",
          "Preta",
          [
            "Polvo",
            "Baleia-azul",
            "Camaleão"
          ]
        ],
        [
          "Qual animal é conhecido por projetar uma língua muito longa para capturar insetos?",
          "Camaleão",
          [
            "Ornitorrinco",
            "Baleia-azul",
            "Guepardo"
          ]
        ],
        [
          "Qual mamífero põe ovos?",
          "Ornitorrinco",
          [
            "Girafa",
            "Avestruz",
            "Camaleão"
          ]
        ],
        [
          "Qual ave não voa e é a maior do mundo?",
          "Avestruz",
          [
            "Camaleão",
            "Elefante",
            "Polvo"
          ]
        ],
        [
          "Qual animal terrestre é o mais rápido?",
          "Guepardo",
          [
            "Elefante",
            "Ornitorrinco",
            "Morcego"
          ]
        ],
        [
          "Qual animal dorme pendurado de cabeça para baixo?",
          "Morcego",
          [
            "Polvo",
            "Girafa",
            "Camaleão"
          ]
        ],
        [
          "Qual animal muda de cor para comunicação e camuflagem?",
          "Camaleão",
          [
            "Guepardo",
            "Morcego",
            "Girafa"
          ]
        ],
        [
          "Qual inseto produz seda?",
          "Bicho-da-seda",
          [
            "Avestruz",
            "Girafa",
            "Elefante"
          ]
        ],
        [
          "Qual inseto vive em colônias com rainha e operárias?",
          "Abelha",
          [
            "Morcego",
            "Guepardo",
            "Polvo"
          ]
        ],
        [
          "Qual animal tem listras únicas como impressões digitais?",
          "Zebra",
          [
            "Girafa",
            "Guepardo",
            "Polvo"
          ]
        ],
        [
          "Qual animal possui uma tromba?",
          "Elefante",
          [
            "Morcego",
            "Avestruz",
            "Polvo"
          ]
        ],
        [
          "Qual planeta tem o dia mais longo em rotação?",
          "Vênus",
          [
            "Saturno",
            "Netuno",
            "Mercúrio"
          ]
        ],
        [
          "Qual planeta é o mais quente do Sistema Solar?",
          "Vênus",
          [
            "Mercúrio",
            "Marte",
            "Urano"
          ]
        ],
        [
          "Qual planeta possui a Grande Mancha Vermelha?",
          "Júpiter",
          [
            "Urano",
            "Netuno",
            "Terra"
          ]
        ],
        [
          "Qual planeta tem os ventos mais rápidos do Sistema Solar?",
          "Netuno",
          [
            "Vênus",
            "Urano",
            "Saturno"
          ]
        ],
        [
          "Qual lua de Saturno possui atmosfera densa?",
          "Titã",
          [
            "Calisto",
            "Lua",
            "Ganimedes"
          ]
        ],
        [
          "Qual é a maior lua do Sistema Solar?",
          "Ganimedes",
          [
            "Titã",
            "Calisto",
            "Europa"
          ]
        ],
        [
          "Qual é o elemento químico mais leve?",
          "Hidrogênio",
          [
            "Hélio",
            "Oxigênio",
            "Alumínio"
          ]
        ],
        [
          "Qual metal é mais abundante na crosta terrestre?",
          "Alumínio",
          [
            "Hidrogênio",
            "Hélio",
            "Ferro"
          ]
        ],
        [
          "Qual gás nobre é usado em balões por ser leve e não inflamável?",
          "Hélio",
          [
            "Ferro",
            "Alumínio",
            "Hidrogênio"
          ]
        ],
        [
          "Qual substância natural é a mais dura?",
          "Diamante",
          [
            "Ornitorrinco",
            "Baleia-azul",
            "Girafa"
          ]
        ],
        [
          "Qual é o maior deserto do mundo considerando desertos frios?",
          "Antártida",
          [
            "Ornitorrinco",
            "Elefante",
            "Baleia-azul"
          ]
        ],
        [
          "Qual lago é o mais profundo do mundo?",
          "Baikal",
          [
            "Deserto do Saara",
            "Monte Everest",
            "Salto Ángel"
          ]
        ],
        [
          "Qual cachoeira tem a maior queda ininterrupta do mundo?",
          "Salto Ángel",
          [
            "Fossa das Marianas",
            "Monte Everest",
            "Deserto do Saara"
          ]
        ],
        [
          "Qual país possui o maior número de fusos horários considerando territórios?",
          "França",
          [
            "Avestruz",
            "Girafa",
            "Guepardo"
          ]
        ],
        [
          "Qual cidade é conhecida como Cidade Eterna?",
          "Roma",
          [
            "Guepardo",
            "Polvo",
            "Avestruz"
          ]
        ],
        [
          "Qual cidade é conhecida como Cidade Luz?",
          "Paris",
          [
            "Morcego",
            "Girafa",
            "Avestruz"
          ]
        ],
        [
          "Qual país inventou o papel segundo registros históricos?",
          "China",
          [
            "Elefante",
            "Avestruz",
            "Baleia-azul"
          ]
        ],
        [
          "Qual povo desenvolveu um dos primeiros sistemas de escrita alfabética?",
          "Fenícios",
          [
            "Polvo",
            "Baleia-azul",
            "Camaleão"
          ]
        ],
        [
          "Qual objeto foi inventado por Johannes Gutenberg para impressão em massa?",
          "Prensa de tipos móveis",
          [
            "Ornitorrinco",
            "Guepardo",
            "Polvo"
          ]
        ],
        [
          "Qual invenção de Alexander Graham Bell transmitia voz à distância?",
          "Telefone",
          [
            "Avestruz",
            "Camaleão",
            "Morcego"
          ]
        ],
        [
          "Qual cientista formulou as leis do movimento e da gravitação clássica?",
          "Isaac Newton",
          [
            "Ornitorrinco",
            "Morcego",
            "Elefante"
          ]
        ],
        [
          "Qual cientista propôs a teoria da relatividade?",
          "Albert Einstein",
          [
            "Camaleão",
            "Ornitorrinco",
            "Elefante"
          ]
        ],
        [
          "Qual cientista estudou a radioatividade e ganhou dois Nobéis?",
          "Marie Curie",
          [
            "Polvo",
            "Ornitorrinco",
            "Camaleão"
          ]
        ],
        [
          "Qual navegador realizou a primeira circum-navegação, concluída por sua expedição?",
          "Fernão de Magalhães",
          [
            "Girafa",
            "Elefante",
            "Baleia-azul"
          ]
        ],
        [
          "Qual é a única letra que não aparece em nenhum símbolo químico atual?",
          "J",
          [
            "Ornitorrinco",
            "Guepardo",
            "Morcego"
          ]
        ],
        [
          "Quantos lados tem um icoságono?",
          "20",
          [
            "Morcego",
            "Guepardo",
            "Girafa"
          ]
        ],
        [
          "Qual palavra é um palíndromo?",
          "arara",
          [
            "Polvo",
            "Guepardo",
            "Avestruz"
          ]
        ],
        [
          "Qual é o único continente atravessado por todos os meridianos?",
          "Antártida",
          [
            "Morcego",
            "Girafa",
            "Baleia-azul"
          ]
        ],
        [
          "Qual alimento é botanicamente uma fruta, mas usado como legume?",
          "Tomate",
          [
            "Camaleão",
            "Baleia-azul",
            "Morcego"
          ]
        ],
        [
          "Qual mamífero marinho possui o maior cérebro?",
          "Cachalote",
          [
            "Camaleão",
            "Guepardo",
            "Morcego"
          ]
        ]
      ]
    },
    {
      "slug": "religiao",
      "questions": [
        [
          "Qual é o livro sagrado central do cristianismo?",
          "Bíblia",
          [
            "Mateus",
            "João",
            "Gênesis"
          ]
        ],
        [
          "Como se chama o mês de jejum no islamismo?",
          "Ramadã",
          [
            "Apocalipse",
            "João",
            "Mateus"
          ]
        ],
        [
          "Qual cidade é sagrada para judeus, cristãos e muçulmanos?",
          "Jerusalém",
          [
            "Belém",
            "Vaticano",
            "Nazaré"
          ]
        ],
        [
          "Em qual país o budismo surgiu?",
          "Índia",
          [
            "João",
            "Mateus",
            "Isaías"
          ]
        ],
        [
          "Qual é o principal dia semanal de descanso e culto no judaísmo?",
          "Shabat",
          [
            "Atos dos Apóstolos",
            "Jonas",
            "Gênesis"
          ]
        ],
        [
          "Quem é tradicionalmente associado à fundação do budismo?",
          "Siddhartha Gautama",
          [
            "Paulo",
            "Davi",
            "Noé"
          ]
        ],
        [
          "Qual celebração cristã recorda a ressurreição de Jesus?",
          "Páscoa",
          [
            "Quaresma",
            "Natal",
            "Epifania"
          ]
        ],
        [
          "Como é chamado um local de culto islâmico?",
          "Mesquita",
          [
            "Roma",
            "Jerusalém",
            "Belém"
          ]
        ],
        [
          "Qual tradição religiosa tem os Vedas entre seus textos antigos?",
          "Hinduísmo",
          [
            "Islamismo",
            "Judaísmo",
            "Budismo"
          ]
        ],
        [
          "O diálogo respeitoso entre diferentes religiões é chamado de quê?",
          "Diálogo inter-religioso",
          [
            "João",
            "Êxodo",
            "Mateus"
          ]
        ],
        [
          "Quantos livros compõem a Bíblia Católica?",
          "73",
          [
            "66",
            "72",
            "75"
          ]
        ],
        [
          "Quantos livros possui o Novo Testamento?",
          "27",
          [
            "24",
            "39",
            "46"
          ]
        ],
        [
          "Qual é o primeiro livro da Bíblia?",
          "Gênesis",
          [
            "João",
            "Êxodo",
            "Mateus"
          ]
        ],
        [
          "Qual é o último livro da Bíblia?",
          "Apocalipse",
          [
            "Salmos",
            "Jonas",
            "Isaías"
          ]
        ],
        [
          "Quem construiu a arca segundo o Gênesis?",
          "Noé",
          [
            "Maria",
            "Pedro",
            "Paulo"
          ]
        ],
        [
          "Quem recebeu os Dez Mandamentos no Sinai?",
          "Moisés",
          [
            "Judas Iscariotes",
            "Maria",
            "Pedro"
          ]
        ],
        [
          "Quem derrotou Golias?",
          "Davi",
          [
            "Moisés",
            "Maria",
            "Paulo"
          ]
        ],
        [
          "Quem foi lançado na cova dos leões?",
          "Daniel",
          [
            "Pedro",
            "Davi",
            "Moisés"
          ]
        ],
        [
          "Qual profeta foi engolido por um grande peixe?",
          "Jonas",
          [
            "Atos dos Apóstolos",
            "Gênesis",
            "Isaías"
          ]
        ],
        [
          "Quem foi a mãe de Jesus?",
          "Maria",
          [
            "Judas Iscariotes",
            "Pedro",
            "Paulo"
          ]
        ],
        [
          "Em qual cidade Jesus nasceu?",
          "Belém",
          [
            "Meca",
            "Jerusalém",
            "Vaticano"
          ]
        ],
        [
          "Em qual cidade Jesus cresceu?",
          "Nazaré",
          [
            "Roma",
            "Belém",
            "Meca"
          ]
        ],
        [
          "Quem batizou Jesus no rio Jordão?",
          "João Batista",
          [
            "Davi",
            "Moisés",
            "Abraão"
          ]
        ],
        [
          "Quantos apóstolos Jesus escolheu?",
          "12",
          [
            "Mateus",
            "Salmos",
            "Daniel"
          ]
        ],
        [
          "Quem negou Jesus três vezes?",
          "Pedro",
          [
            "Maria",
            "Judas Iscariotes",
            "Davi"
          ]
        ],
        [
          "Quem traiu Jesus?",
          "Judas Iscariotes",
          [
            "Pedro",
            "Paulo",
            "Moisés"
          ]
        ],
        [
          "Qual apóstolo era cobrador de impostos?",
          "Mateus",
          [
            "João",
            "Jonas",
            "Apocalipse"
          ]
        ],
        [
          "Qual apóstolo ficou conhecido como o discípulo amado?",
          "João",
          [
            "Isaías",
            "Daniel",
            "Apocalipse"
          ]
        ],
        [
          "Qual acontecimento é celebrado em Pentecostes?",
          "Descida do Espírito Santo",
          [
            "Mateus",
            "Gênesis",
            "João"
          ]
        ],
        [
          "Qual sacramento apaga o pecado original e inicia a vida cristã?",
          "Batismo",
          [
            "Matrimônio",
            "Confirmação",
            "Eucaristia"
          ]
        ],
        [
          "Qual sacramento fortalece com o dom do Espírito Santo?",
          "Crisma",
          [
            "Confirmação",
            "Batismo",
            "Matrimônio"
          ]
        ],
        [
          "Qual sacramento torna presente o Corpo e Sangue de Cristo?",
          "Eucaristia",
          [
            "Unção dos Enfermos",
            "Matrimônio",
            "Confirmação"
          ]
        ],
        [
          "Qual sacramento concede o perdão dos pecados após o Batismo?",
          "Reconciliação",
          [
            "Eucaristia",
            "Matrimônio",
            "Confirmação"
          ]
        ],
        [
          "Qual sacramento une um homem e uma mulher em aliança matrimonial?",
          "Matrimônio",
          [
            "Batismo",
            "Reconciliação",
            "Confirmação"
          ]
        ],
        [
          "Qual sacramento configura ministros ao serviço da Igreja?",
          "Ordem",
          [
            "Reconciliação",
            "Confirmação",
            "Batismo"
          ]
        ],
        [
          "Qual sacramento oferece graça especial aos enfermos?",
          "Unção dos Enfermos",
          [
            "Confirmação",
            "Ordem",
            "Reconciliação"
          ]
        ],
        [
          "Quantos sacramentos existem na Igreja Católica?",
          "7",
          [
            "Matrimônio",
            "Confirmação",
            "Unção dos Enfermos"
          ]
        ],
        [
          "Qual é o primeiro tempo do ano litúrgico?",
          "Advento",
          [
            "Pentecostes",
            "Páscoa",
            "Quaresma"
          ]
        ],
        [
          "Qual cor litúrgica é usada normalmente no Tempo Comum?",
          "Verde",
          [
            "Êxodo",
            "Atos dos Apóstolos",
            "João"
          ]
        ],
        [
          "Qual cor litúrgica é usada normalmente no Advento e na Quaresma?",
          "Roxo",
          [
            "Salmos",
            "Jonas",
            "Mateus"
          ]
        ],
        [
          "Qual dia inicia a Quaresma?",
          "Quarta-feira de Cinzas",
          [
            "Apocalipse",
            "Daniel",
            "Isaías"
          ]
        ],
        [
          "Qual celebração recorda a instituição da Eucaristia?",
          "Quinta-feira Santa",
          [
            "Quaresma",
            "Epifania",
            "Páscoa"
          ]
        ],
        [
          "Qual dia recorda a Paixão e Morte de Jesus?",
          "Sexta-feira Santa",
          [
            "Êxodo",
            "Gênesis",
            "João"
          ]
        ],
        [
          "Qual oração Jesus ensinou aos discípulos?",
          "Pai-Nosso",
          [
            "Apocalipse",
            "Gênesis",
            "Isaías"
          ]
        ],
        [
          "Qual oração mariana começa com “Ave, Maria, cheia de graça”?",
          "Ave-Maria",
          [
            "Mateus",
            "João",
            "Daniel"
          ]
        ],
        [
          "Quem é o sucessor de São Pedro na Igreja Católica?",
          "Papa",
          [
            "Moisés",
            "João Batista",
            "Pedro"
          ]
        ],
        [
          "Qual cidade-Estado é sede da Igreja Católica?",
          "Vaticano",
          [
            "Roma",
            "Jerusalém",
            "Nazaré"
          ]
        ],
        [
          "Qual santo é conhecido como padroeiro dos animais e da ecologia?",
          "São Francisco de Assis",
          [
            "Apocalipse",
            "Êxodo",
            "João"
          ]
        ],
        [
          "Qual santa é conhecida como a pequena flor?",
          "Santa Teresinha do Menino Jesus",
          [
            "Isaías",
            "Mateus",
            "Daniel"
          ]
        ],
        [
          "Qual documento reúne de forma sistemática a doutrina católica?",
          "Catecismo da Igreja Católica",
          [
            "Atos dos Apóstolos",
            "Mateus",
            "João"
          ]
        ]
      ]
    }
  ]
  $catalog$::jsonb;
  category_record jsonb;
  question_record jsonb;
  category_uuid uuid;
  game_uuid uuid;
  question_uuid bigint;
  edition integer;
  question_position integer;
  correct_position integer;
  choice_position integer;
  wrong_index integer;
  answer_text text;
  seed text;
begin
  for category_record in select value from jsonb_array_elements(catalog)
  loop
    select id into category_uuid
    from categories
    where slug = category_record->>'slug';

    for edition in 1..50
    loop
      seed := (category_record->>'slug') || '-' || lpad(edition::text, 2, '0');

      insert into games (
        author_id,
        category_id,
        title,
        is_public,
        is_default,
        seed_key,
        published_at,
        created_at,
        updated_at
      )
      values (
        '00000000-0000-4000-8000-000000000001'::uuid,
        category_uuid,
        (select name from categories where id = category_uuid) ||
          ' — Desafio ' || lpad(edition::text, 2, '0'),
        true,
        true,
        seed,
        now() - make_interval(mins => (1001 - edition)),
        now() - make_interval(mins => (1001 - edition)),
        now() - make_interval(mins => (1001 - edition))
      )
      on conflict (seed_key) where seed_key is not null do nothing
      returning id into game_uuid;

      if game_uuid is null then
        continue;
      end if;

      question_position := 0;
      for question_position in 0..9
      loop
        question_record := category_record->'questions'->(
          (edition - 1 + question_position) %
          jsonb_array_length(category_record->'questions')
        );
        correct_position := (edition + question_position) % 4;

        insert into questions (
          game_id,
          position,
          question_text,
          correct_answer,
          time_seconds
        )
        values (
          game_uuid,
          question_position,
          question_record->>0,
          correct_position,
          30
        )
        returning id into question_uuid;

        wrong_index := 0;
        for choice_position in 0..3
        loop
          if choice_position = correct_position then
            answer_text := question_record->>1;
          else
            answer_text := question_record->2->>wrong_index;
            wrong_index := wrong_index + 1;
          end if;

          insert into choices (question_id, position, choice_text)
          values (question_uuid, choice_position, answer_text);
        end loop;
      end loop;
    end loop;
  end loop;
end
$$;


