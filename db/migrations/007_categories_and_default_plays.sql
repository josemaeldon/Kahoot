create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  slug varchar(90) not null,
  is_default boolean not null default false,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint categories_name_not_blank check (
    char_length(btrim(name)) between 2 and 80
  ),
  constraint categories_slug_not_blank check (
    char_length(btrim(slug)) between 2 and 90
  )
);

create unique index if not exists categories_name_lower_uidx
  on categories (lower(name));

create unique index if not exists categories_slug_uidx
  on categories (slug);

alter table games
  add column if not exists category_id uuid,
  add column if not exists is_default boolean not null default false,
  add column if not exists seed_key text;

insert into categories (name, slug, is_default)
values
  ('Matemática', 'matematica', true),
  ('Português', 'portugues', true),
  ('Ciências', 'ciencias', true),
  ('História', 'historia', true),
  ('Geografia', 'geografia', true),
  ('Inglês', 'ingles', true),
  ('Tecnologia', 'tecnologia', true),
  ('Artes', 'artes', true),
  ('Música', 'musica', true),
  ('Esportes', 'esportes', true),
  ('Cinema e TV', 'cinema-e-tv', true),
  ('Literatura', 'literatura', true),
  ('Cultura Geral', 'cultura-geral', true),
  ('Natureza e Meio Ambiente', 'natureza-e-meio-ambiente', true),
  ('Saúde e Bem-estar', 'saude-e-bem-estar', true),
  ('Negócios e Empreendedorismo', 'negocios-e-empreendedorismo', true),
  ('Finanças', 'financas', true),
  ('Gastronomia', 'gastronomia', true),
  ('Viagens', 'viagens', true),
  ('Curiosidades', 'curiosidades', true)
on conflict (slug) do update
set name = excluded.name,
    is_default = true;

update games
set category_id = (
  select id from categories where slug = 'cultura-geral'
)
where category_id is null;

alter table games
  alter column category_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'games_category_id_fkey'
      and conrelid = 'games'::regclass
  ) then
    alter table games
      add constraint games_category_id_fkey
      foreign key (category_id)
      references categories(id)
      on delete restrict;
  end if;
end
$$;

create index if not exists games_category_created_idx
  on games (category_id, created_at desc);

create index if not exists games_public_category_published_idx
  on games (category_id, published_at desc, created_at desc)
  where is_public = true;

create unique index if not exists games_seed_key_uidx
  on games (seed_key)
  where seed_key is not null;

insert into users (
  id,
  username,
  password_hash,
  role,
  is_enabled,
  whatsapp
)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Play! Oficial',
  '$2b$12$QxYyVkJjQmJUV3E0Z2RYeeM2TCV0pHhASnFvKzO4mU.v7z/t0fZqK',
  'user',
  false,
  null
)
on conflict (id) do update
set username = excluded.username,
    is_enabled = false,
    updated_at = now();

do $$
declare
  catalog jsonb := $catalog$
  [
    {"slug":"matematica","questions":[
      ["Quanto é 7 × 8?","56",["48","54","64"]],["Qual é a raiz quadrada de 81?","9",["7","8","10"]],
      ["Quanto é 15% de 200?","30",["15","20","40"]],["Qual fração equivale a 0,5?","1/2",["1/3","2/3","3/4"]],
      ["Quanto é 144 ÷ 12?","12",["10","11","14"]],["Qual é o próximo número primo após 11?","13",["12","14","15"]],
      ["Um triângulo tem quantos lados?","3",["2","4","5"]],["Quanto é 2 elevado à quinta potência?","32",["10","16","25"]],
      ["Qual é a soma dos ângulos internos de um triângulo?","180°",["90°","270°","360°"]],["Quanto é 3,5 + 2,75?","6,25",["5,25","6,15","7,25"]]
    ]},
    {"slug":"portugues","questions":[
      ["Qual é o plural de cidadão?","cidadãos",["cidadões","cidadães","cidadans"]],["Qual palavra é um verbo?","correr",["rápido","corrida","corredor"]],
      ["Qual é o antônimo de claro?","escuro",["brilhante","limpo","leve"]],["Em 'A menina leu o livro', qual é o sujeito?","A menina",["leu","o livro","livro"]],
      ["Qual palavra está corretamente acentuada?","lâmpada",["lampâda","làmpada","lampada"]],["Qual é um sinônimo de feliz?","contente",["triste","áspero","distante"]],
      ["Qual sinal encerra uma pergunta?","ponto de interrogação",["vírgula","dois-pontos","ponto e vírgula"]],["Qual palavra é um substantivo próprio?","Brasil",["país","cidade","pessoa"]],
      ["Qual é o diminutivo de casa?","casinha",["casarão","casebre","casario"]],["Em qual opção há encontro vocálico?","saída",["prato","bloco","fruta"]]
    ]},
    {"slug":"ciencias","questions":[
      ["Qual planeta é conhecido como Planeta Vermelho?","Marte",["Vênus","Júpiter","Saturno"]],["Qual gás respiramos para sobreviver?","Oxigênio",["Hélio","Hidrogênio","Metano"]],
      ["A água ferve, ao nível do mar, a quantos graus Celsius?","100 °C",["0 °C","50 °C","212 °C"]],["Qual órgão bombeia o sangue?","Coração",["Pulmão","Fígado","Rim"]],
      ["Qual é a unidade básica da vida?","Célula",["Átomo","Tecido","Órgão"]],["Como se chama a passagem do líquido para o gasoso?","Evaporação",["Fusão","Condensação","Solidificação"]],
      ["Qual estrela ilumina a Terra?","Sol",["Lua","Sírius","Vênus"]],["Quantos estados físicos clássicos da matéria são ensinados?","3",["2","4","5"]],
      ["Qual força nos mantém no solo?","Gravidade",["Magnetismo","Atrito","Eletricidade"]],["Qual vitamina é produzida com ajuda da luz solar?","Vitamina D",["Vitamina A","Vitamina C","Vitamina K"]]
    ]},
    {"slug":"historia","questions":[
      ["Em que ano o Brasil declarou a Independência?","1822",["1500","1889","1922"]],["Quem proclamou a República no Brasil?","Marechal Deodoro",["Dom Pedro I","Tiradentes","Getúlio Vargas"]],
      ["Qual civilização construiu as pirâmides de Gizé?","Egípcia",["Romana","Maia","Grega"]],["Em que continente surgiu a humanidade?","África",["Europa","Ásia","América"]],
      ["Qual evento começou em 1789?","Revolução Francesa",["Reforma Protestante","Revolução Russa","Guerra Fria"]],["Quem foi o primeiro imperador do Brasil?","Dom Pedro I",["Dom Pedro II","Dom João VI","José Bonifácio"]],
      ["Qual povo criou a democracia em Atenas?","Gregos",["Fenícios","Persas","Vikings"]],["A Segunda Guerra Mundial terminou em qual ano?","1945",["1918","1939","1960"]],
      ["Qual documento aboliu a escravidão no Brasil?","Lei Áurea",["Lei do Ventre Livre","Constituição de 1824","Tratado de Tordesilhas"]],["Qual cidade romana foi soterrada pelo Vesúvio?","Pompeia",["Esparta","Troia","Cartago"]]
    ]},
    {"slug":"geografia","questions":[
      ["Qual é o maior país do mundo em área?","Rússia",["Canadá","China","Brasil"]],["Qual é a capital do Brasil?","Brasília",["Rio de Janeiro","São Paulo","Salvador"]],
      ["Qual oceano banha a costa leste brasileira?","Atlântico",["Pacífico","Índico","Ártico"]],["Em qual continente fica o Egito?","África",["Ásia","Europa","Oceania"]],
      ["Qual é o rio de maior volume de água do mundo?","Amazonas",["Nilo","Mississipi","Danúbio"]],["Qual é a capital da Argentina?","Buenos Aires",["Santiago","Lima","Montevidéu"]],
      ["Qual linha imaginária divide a Terra em hemisférios Norte e Sul?","Equador",["Greenwich","Trópico de Câncer","Círculo Polar"]],["Qual é o menor continente em área?","Oceania",["Europa","Antártida","América"]],
      ["Em qual região brasileira fica o estado do Pará?","Norte",["Nordeste","Centro-Oeste","Sudeste"]],["Qual é o ponto mais alto da Terra?","Monte Everest",["K2","Aconcágua","Kilimanjaro"]]
    ]},
    {"slug":"ingles","questions":[
      ["Como se diz 'livro' em inglês?","book",["look","cook","door"]],["Qual é o passado de 'go'?","went",["goed","gone","goes"]],
      ["O que significa 'good morning'?","bom dia",["boa noite","boa tarde","até logo"]],["Qual pronome significa 'nós'?","we",["they","you","she"]],
      ["Qual é o plural de 'child'?","children",["childs","childes","childrens"]],["Como se diz 'vermelho' em inglês?","red",["blue","green","yellow"]],
      ["Complete: She ___ a teacher.","is",["are","am","be"]],["O que significa 'always'?","sempre",["nunca","talvez","ontem"]],
      ["Qual palavra é um animal?","horse",["house","shirt","cloud"]],["Como se diz 'obrigado' em inglês?","thank you",["please","sorry","welcome"]]
    ]},
    {"slug":"tecnologia","questions":[
      ["O que significa CPU?","Unidade Central de Processamento",["Controle Principal Universal","Código de Programa Único","Central de Porta USB"]],["Qual protocolo é usado para páginas web seguras?","HTTPS",["FTP","SMTP","SSH"]],
      ["Qual linguagem estrutura páginas web?","HTML",["CSS","SQL","PNG"]],["O que é armazenamento em nuvem?","Dados em servidores remotos",["Arquivos apenas no celular","Memória RAM extra","Um antivírus"]],
      ["Qual componente guarda dados temporários em uso?","RAM",["SSD","Monitor","Teclado"]],["O que é phishing?","Tentativa de roubar dados",["Compactação de arquivos","Atualização automática","Cópia de segurança"]],
      ["Qual destes é um sistema operacional?","Linux",["Chrome","Python","Wi-Fi"]],["Para que serve um firewall?","Controlar tráfego de rede",["Editar imagens","Aumentar a tela","Carregar a bateria"]],
      ["O que significa URL?","Localizador Uniforme de Recursos",["Registro Universal Local","Rede Única Linear","Usuário Remoto Livre"]],["Qual é uma boa prática de senha?","Usar frase longa e única",["Repetir a mesma senha","Usar 123456","Compartilhar por mensagem"]]
    ]},
    {"slug":"artes","questions":[
      ["Quem pintou a Mona Lisa?","Leonardo da Vinci",["Michelangelo","Van Gogh","Picasso"]],["Quais são as cores primárias tradicionais na pintura?","Vermelho, azul e amarelo",["Verde, roxo e laranja","Preto, branco e cinza","Azul, verde e rosa"]],
      ["Qual movimento é associado a Claude Monet?","Impressionismo",["Cubismo","Surrealismo","Barroco"]],["Como se chama uma obra feita com pequenos pedaços unidos?","Mosaico",["Afresco","Gravura","Aquarela"]],
      ["Qual artista pintou 'Noite Estrelada'?","Vincent van Gogh",["Salvador Dalí","Tarsila do Amaral","Rembrandt"]],["O que é uma escultura?","Arte em três dimensões",["Apenas desenho a lápis","Texto teatral","Canção instrumental"]],
      ["Qual movimento usa formas geométricas fragmentadas?","Cubismo",["Romantismo","Realismo","Rococó"]],["Quem pintou 'Abaporu'?","Tarsila do Amaral",["Anita Malfatti","Portinari","Di Cavalcanti"]],
      ["Qual material é comum na aquarela?","Pigmento diluído em água",["Argila queimada","Madeira entalhada","Metal fundido"]],["Como se chama a arte de dobrar papel?","Origami",["Grafite","Cerâmica","Tapeçaria"]]
    ]},
    {"slug":"musica","questions":[
      ["Quantas notas há na escala musical básica?","7",["5","8","12"]],["Qual instrumento tem teclas brancas e pretas?","Piano",["Violino","Flauta","Tambor"]],
      ["Qual clave é comum para sons agudos?","Clave de sol",["Clave de fá","Clave de dó","Clave rítmica"]],["Quem compôs a Nona Sinfonia?","Beethoven",["Mozart","Bach","Chopin"]],
      ["Qual instrumento pertence à família das cordas?","Violoncelo",["Trompete","Clarinete","Pandeiro"]],["O que indica o andamento de uma música?","Sua velocidade",["Sua letra","Seu idioma","Seu autor"]],
      ["Qual gênero brasileiro nasceu no Rio de Janeiro?","Samba",["Tango","Reggae","Flamenco"]],["Quantos tempos tem um compasso 4/4?","4",["2","3","8"]],
      ["Como se chama um grupo de três músicos?","Trio",["Dueto","Quarteto","Quinteto"]],["Qual símbolo indica silêncio musical?","Pausa",["Clave","Nota","Sustenido"]]
    ]},
    {"slug":"esportes","questions":[
      ["Quantos jogadores cada time tem em campo no futebol?","11",["5","7","12"]],["Qual esporte usa uma cesta e uma bola laranja?","Basquete",["Vôlei","Tênis","Handebol"]],
      ["Quantos anéis há no símbolo olímpico?","5",["4","6","7"]],["Em qual esporte se usa uma raquete e uma peteca?","Badminton",["Beisebol","Golfe","Rugby"]],
      ["Qual país sediou a Copa do Mundo de 2014?","Brasil",["África do Sul","Rússia","Alemanha"]],["Quantos sets um time precisa vencer no vôlei melhor de cinco?","3",["2","4","5"]],
      ["Qual é a distância oficial de uma maratona?","42,195 km",["21 km","40 km","50 km"]],["Em qual esporte há nado borboleta?","Natação",["Remo","Surfe","Polo aquático"]],
      ["Que cartão expulsa um jogador no futebol?","Vermelho",["Amarelo","Verde","Azul"]],["Qual peça vale mais no xadrez depois do rei?","Dama",["Torre","Bispo","Cavalo"]]
    ]},
    {"slug":"cinema-e-tv","questions":[
      ["Quem dirige a criação artística de um filme?","Diretor",["Produtor de elenco","Exibidor","Crítico"]],["Qual prêmio é tradicional no cinema dos Estados Unidos?","Oscar",["Grammy","Pulitzer","Nobel"]],
      ["Como se chama o texto com cenas e diálogos?","Roteiro",["Legenda","Trailer","Crédito"]],["Qual profissional interpreta personagens?","Ator",["Editor","Cenógrafo","Operador de som"]],
      ["O que é uma sequência?","Continuação de uma obra",["Primeira exibição","Erro de gravação","Cartaz promocional"]],["Qual gênero busca provocar medo?","Terror",["Comédia","Musical","Documentário"]],
      ["O que faz a direção de fotografia?","Define imagem e iluminação",["Vende ingressos","Escreve legendas","Escolhe o título"]],["Como se chama a música criada para um filme?","Trilha sonora",["Dublagem","Cenografia","Montagem"]],
      ["O que é um documentário?","Obra sobre fatos e pessoas reais",["Filme sempre animado","Programa esportivo ao vivo","Comercial curto"]],["Qual formato conta uma história em episódios?","Série",["Curta isolado","Trailer","Videoclipe"]]
    ]},
    {"slug":"literatura","questions":[
      ["Quem escreveu 'Dom Casmurro'?","Machado de Assis",["José de Alencar","Graciliano Ramos","Carlos Drummond"]],["Quem escreveu 'O Pequeno Príncipe'?","Antoine de Saint-Exupéry",["Jules Verne","Victor Hugo","Albert Camus"]],
      ["O que é um narrador?","A voz que conta a história",["Sempre o autor real","O leitor principal","O editor do livro"]],["Qual gênero costuma ser escrito em versos?","Poesia",["Notícia","Manual","Verbete"]],
      ["Quem criou Sherlock Holmes?","Arthur Conan Doyle",["Agatha Christie","Edgar Allan Poe","J. R. R. Tolkien"]],["Qual obra começa com a viagem de Bilbo?","O Hobbit",["A Odisseia","1984","Os Lusíadas"]],
      ["Como se chama a personagem principal?","Protagonista",["Antagonista","Narrador","Coadjuvante"]],["Quem escreveu 'Quarto de Despejo'?","Carolina Maria de Jesus",["Clarice Lispector","Cecília Meireles","Cora Coralina"]],
      ["O que é uma fábula?","Narrativa curta com ensinamento",["Poema sem versos","Biografia científica","Peça sem personagens"]],["Qual autor escreveu 'Romeu e Julieta'?","William Shakespeare",["Dante Alighieri","Miguel de Cervantes","Oscar Wilde"]]
    ]},
    {"slug":"cultura-geral","questions":[
      ["Qual é a moeda do Japão?","Iene",["Won","Yuan","Rúpia"]],["Quantos dias tem um ano bissexto?","366",["365","364","367"]],
      ["Qual é o maior mamífero do mundo?","Baleia-azul",["Elefante","Girafa","Hipopótamo"]],["Qual idioma tem mais falantes nativos?","Mandarim",["Inglês","Espanhol","Hindi"]],
      ["Qual metal tem símbolo químico Au?","Ouro",["Prata","Cobre","Alumínio"]],["Qual país tem formato lembrado como uma bota?","Itália",["Grécia","Portugal","Chile"]],
      ["Quantos lados tem um hexágono?","6",["5","7","8"]],["Qual é o nome do satélite natural da Terra?","Lua",["Sol","Marte","Europa"]],
      ["Qual cor resulta da mistura de azul e amarelo?","Verde",["Roxo","Laranja","Rosa"]],["Qual é o primeiro mês do ano?","Janeiro",["Fevereiro","Março","Dezembro"]]
    ]},
    {"slug":"natureza-e-meio-ambiente","questions":[
      ["Qual processo permite às plantas produzir alimento?","Fotossíntese",["Respiração pulmonar","Fermentação","Evaporação"]],["Qual gás é mais associado ao aquecimento global causado por atividades humanas?","Dióxido de carbono",["Oxigênio","Hélio","Neônio"]],
      ["O que significa reciclar?","Transformar resíduos em novos materiais",["Enterrar todo o lixo","Queimar plástico","Descartar em rios"]],["Qual bioma ocupa grande parte do Norte do Brasil?","Amazônia",["Pampa","Caatinga","Pantanal"]],
      ["Qual fonte de energia é renovável?","Solar",["Carvão","Petróleo","Gás natural"]],["Como se chama a variedade de seres vivos?","Biodiversidade",["Meteorologia","Geologia","Astronomia"]],
      ["Qual animal é importante polinizador?","Abelha",["Tubarão","Pinguim","Polvo"]],["O desmatamento remove principalmente o quê?","Vegetação nativa",["Nuvens","Rochas","Marés"]],
      ["Qual atitude economiza água?","Fechar a torneira ao escovar os dentes",["Lavar calçada com mangueira","Tomar banhos longos","Ignorar vazamentos"]],["Onde vivem animais e plantas de uma espécie?","Habitat",["Clima","Minério","Horizonte"]]
    ]},
    {"slug":"saude-e-bem-estar","questions":[
      ["Qual hábito ajuda a prevenir doenças infecciosas?","Lavar as mãos",["Dormir menos","Compartilhar copos","Evitar água"]],["Quantas horas de sono são geralmente recomendadas para adultos?","7 a 9 horas",["2 a 4 horas","4 a 5 horas","12 a 15 horas"]],
      ["Qual nutriente ajuda na construção dos músculos?","Proteína",["Açúcar","Sódio","Corante"]],["Qual atividade beneficia o coração?","Exercício aeróbico",["Ficar sentado o dia todo","Fumar","Dormir após toda refeição"]],
      ["O que ajuda a manter a hidratação?","Beber água",["Consumir mais sal","Evitar líquidos","Tomar apenas café"]],["Qual profissional orienta sobre alimentação?","Nutricionista",["Arquiteto","Geólogo","Tradutor"]],
      ["O protetor solar ajuda a proteger contra quê?","Radiação ultravioleta",["Frio","Ruído","Umidade"]],["Qual prática pode reduzir o estresse?","Respiração consciente",["Privação de sono","Excesso de cafeína","Isolamento constante"]],
      ["Por que vacinas são importantes?","Treinam o sistema imunológico",["Substituem toda alimentação","Curam qualquer doença na hora","Eliminam a necessidade de higiene"]],["Qual postura é melhor ao usar o computador?","Coluna apoiada e tela na altura dos olhos",["Pescoço sempre curvado","Pés sem apoio","Tela muito abaixo"]]
    ]},
    {"slug":"negocios-e-empreendedorismo","questions":[
      ["O que é uma proposta de valor?","Benefício que a empresa entrega ao cliente",["Apenas o nome da empresa","Uma taxa bancária","O endereço fiscal"]],["O que significa público-alvo?","Grupo de clientes que se deseja atender",["Todos os fornecedores","Somente concorrentes","Órgãos reguladores"]],
      ["Para que serve um plano de negócios?","Orientar estratégia e operação",["Substituir clientes","Eliminar impostos","Garantir lucro automático"]],["O que é fluxo de caixa?","Entradas e saídas de dinheiro",["Lista de funcionários","Quantidade de anúncios","Valor da marca apenas"]],
      ["O que é MVP?","Versão mínima para testar uma ideia",["Produto final sem testes","Maior valor de produção","Método de venda presencial"]],["Qual indicador mede satisfação por recomendação?","NPS",["PIB","IPCA","DNS"]],
      ["O que é margem de lucro?","Diferença proporcional entre receita e custos",["Total de seguidores","Número de produtos","Prazo de entrega"]],["Qual ação ajuda a validar uma ideia?","Entrevistar potenciais clientes",["Ignorar o mercado","Produzir em massa de imediato","Copiar sem pesquisar"]],
      ["O que é networking?","Construção de relações profissionais",["Configuração de roteador","Contrato de aluguel","Controle de estoque"]],["Qual é uma característica de meta SMART?","Ser mensurável",["Ser vaga","Não ter prazo","Ser impossível"]]
    ]},
    {"slug":"financas","questions":[
      ["O que é orçamento pessoal?","Plano de receitas e despesas",["Um tipo de empréstimo","Apenas uma conta bancária","Um imposto anual"]],["O que são juros compostos?","Juros sobre capital e juros acumulados",["Juros sempre iguais em reais","Desconto sem prazo","Taxa sem cálculo"]],
      ["O que é reserva de emergência?","Dinheiro para imprevistos",["Verba para compras por impulso","Limite do cartão","Empréstimo pré-aprovado"]],["Qual é o efeito da inflação?","Reduz o poder de compra",["Aumenta sempre os salários","Elimina impostos","Torna tudo gratuito"]],
      ["O que significa diversificar investimentos?","Distribuir recursos entre ativos",["Aplicar tudo em um só ativo","Guardar senhas juntas","Usar vários cartões"]],["Qual dívida costuma ter juros altos?","Rotativo do cartão",["Conta paga à vista","Poupança","Salário"]],
      ["O que é liquidez?","Facilidade de converter um ativo em dinheiro",["Lucro garantido","Ausência de risco","Valor do imposto"]],["Para que serve comparar o CET?","Conhecer o custo total do crédito",["Medir a inflação nacional","Calcular salário bruto","Escolher uma senha"]],
      ["Qual atitude melhora o controle financeiro?","Registrar gastos",["Ignorar pequenas despesas","Pagar apenas o mínimo","Comprar sem planejamento"]],["O que é patrimônio líquido pessoal?","Bens menos dívidas",["Somente renda mensal","Limite disponível","Total de compras"]]
    ]},
    {"slug":"gastronomia","questions":[
      ["Qual ingrediente faz o pão crescer?","Fermento",["Sal","Vinagre","Azeite"]],["O que significa cozinhar al dente?","Macio, mas ainda firme",["Totalmente cru","Muito desmanchado","Congelado"]],
      ["Qual é a base tradicional do guacamole?","Abacate",["Batata","Tomate","Milho"]],["Qual utensílio mede a temperatura do alimento?","Termômetro culinário",["Ralador","Batedor","Escumadeira"]],
      ["Qual prato brasileiro leva feijão-preto e carnes?","Feijoada",["Moqueca","Cuscuz","Pamonha"]],["O que é banho-maria?","Aquecimento indireto em água",["Fritura profunda","Corte em cubos","Resfriamento rápido"]],
      ["Qual erva é base do pesto genovês?","Manjericão",["Salsa","Coentro","Alecrim"]],["Qual técnica cozinha com vapor?","Vaporização",["Grelhar","Assar","Saltear"]],
      ["Qual ingrediente dá estrutura ao merengue?","Clara de ovo",["Gema","Farinha","Leite"]],["Para evitar contaminação cruzada, o que fazer?","Separar alimentos crus dos prontos",["Usar a mesma tábua sem lavar","Deixar carne fora da geladeira","Provar com a mesma colher"]]
    ]},
    {"slug":"viagens","questions":[
      ["Qual documento é geralmente exigido em viagens internacionais?","Passaporte",["Carteira de biblioteca","Título de eleitor sempre","Cartão de visita"]],["O que é check-in?","Confirmação de entrada ou embarque",["Cancelamento obrigatório","Compra de souvenir","Troca de moeda"]],
      ["Qual item não deve ir solto na bagagem de mão?","Líquido acima do limite permitido",["Livro","Casaco","Fone de ouvido"]],["O que é fuso horário?","Diferença de hora entre regiões",["Preço da passagem","Tipo de hospedagem","Classe do avião"]],
      ["Para que serve um seguro viagem?","Cobrir imprevistos previstos na apólice",["Garantir clima bom","Dispensar documentos","Evitar filas sempre"]],["Qual aplicativo ou recurso ajuda na navegação?","Mapa offline",["Editor de texto","Calculadora científica","Gravador de voz"]],
      ["O que significa meia pensão em um hotel?","Duas refeições incluídas",["Metade do quarto","Estadia por meio dia","Transporte gratuito"]],["Qual atitude respeita a cultura local?","Conhecer costumes e regras",["Ignorar sinalizações","Fotografar sem permissão","Desrespeitar locais sagrados"]],
      ["O que é conexão aérea?","Troca de voo antes do destino final",["Voo sem escala","Bagagem extraviada","Embarque prioritário"]],["Qual informação conferir antes de sair?","Validade dos documentos",["Cor do avião","Nome de todos os passageiros","Marca das malas"]]
    ]},
    {"slug":"curiosidades","questions":[
      ["Qual animal tem três corações?","Polvo",["Golfinho","Águia","Camelo"]],["Qual é o único mamífero capaz de voo sustentado?","Morcego",["Esquilo-voador","Pinguim","Avestruz"]],
      ["Qual planeta gira quase de lado?","Urano",["Mercúrio","Marte","Júpiter"]],["Qual alimento pode durar muitos anos quando bem armazenado?","Mel",["Leite fresco","Alface","Pão"]],
      ["Quantos braços tem uma estrela-do-mar típica?","5",["4","6","8"]],["Qual parte do corpo humano não possui vasos sanguíneos?","Córnea",["Pele","Fígado","Músculo"]],
      ["Qual país tem mais ilhas catalogadas?","Suécia",["Japão","Indonésia","Filipinas"]],["Qual ave consegue voar para trás?","Beija-flor",["Águia","Pombo","Tucano"]],
      ["Qual é o menor osso do corpo humano?","Estribo",["Fêmur","Rádio","Patela"]],["Que cor a pele de um urso-polar tem sob os pelos?","Preta",["Branca","Rosa","Cinza"]]
    ]}
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
      for question_record in
        select value from jsonb_array_elements(category_record->'questions')
      loop
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

        question_position := question_position + 1;
      end loop;
    end loop;
  end loop;
end
$$;
