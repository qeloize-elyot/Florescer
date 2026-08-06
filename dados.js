/* =========================================================
   Florescer — Base de dados (catálogo, cursos, FAQ, recompensas)
   ========================================================= */

const CATALOGO = [
  {
    id: "p01", nome: "Costela-de-adão", cientifico: "Monstera deliciosa", emoji: "🌿", imagem: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 129.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar a cada 5–7 dias", umidade: "Média a alta",
    porte: "Grande (até 2,5 m)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Adora luz filtrada e detesta sol direto no meio do dia. Gosta de rega regular, mas sem encharcar: espere o dedo afundar 3 cm no substrato seco. Aprecia umidade — borrifar as folhas em dias secos deixa ela feliz.",
    historia: "Nativa das florestas tropicais do sul do México e da Guatemala, a Monstera cresce escalando troncos em busca de luz. Seus furos característicos evoluíram para deixar a luz e o vento passarem até as folhas de baixo. Virou ícone do design modernista dos anos 1950 e nunca mais saiu de moda."
  },
  {
    id: "p02", nome: "Espada-de-são-jorge", cientifico: "Dracaena trifasciata", emoji: "🗡️", imagem: "https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 79.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Tolera meia-sombra e sol suave", agua: "Regar a cada 15 dias", umidade: "Baixa",
    porte: "Médio (60–90 cm)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "A planta mais resistente do catálogo: sobrevive ao esquecimento. Prefere pouca água e detesta chuva constante ou solo encharcado — a raiz apodrece rápido. Aceita desde sombra até sol filtrado.",
    historia: "Originária da África Ocidental, era usada para extrair fibras de corda. No Brasil ganhou o nome de Espada-de-São-Jorge pela crença popular de proteção contra o mau-olhado, sempre plantada na entrada das casas."
  },
  {
    id: "p03", nome: "Samambaia-americana", cientifico: "Nephrolepis exaltata", emoji: "🌾", imagem: "https://images.tcdn.com.br/img/img_prod/350075/muda_de_samambaia_americana_cuia_21_8677_1_c9ee18ac0dba75d67921b9d057367bd0.jpg",
    preco: 69.9, categoria: "Folhagem", ambiente: "Varanda",
    luz: "Meia-sombra, nunca sol direto", agua: "Manter sempre úmida", umidade: "Alta",
    porte: "Médio pendente", dificuldade: "Média", petFriendly: true,
    resumo: "Ama chuva fina e umidade constante — é a planta de banheiro por excelência. Odeia sol direto, que queima as folhas em horas. Segura para lares com cães e gatos.",
    historia: "As samambaias existem há mais de 350 milhões de anos, muito antes das plantas com flores. A variedade Bostoniensis surgiu por acaso em um carregamento enviado a Boston em 1894 e virou febre na era vitoriana."
  },
  {
    id: "p04", nome: "Jiboia-verde", cientifico: "Epipremnum aureum", emoji: "🍃", imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 54.9, categoria: "Pendente", ambiente: "Interno",
    luz: "Luz indireta, tolera sombra", agua: "Regar a cada 7 dias", umidade: "Média",
    porte: "Pendente (até 2 m)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Cresce em quase qualquer lugar, até em copo d'água. Gosta de luz indireta e rega moderada. Tóxica se mastigada — mantenha longe de pets curiosos e crianças pequenas.",
    historia: "Nativa da Polinésia Francesa, escapou de jardins e hoje cobre florestas inteiras no sudeste asiático. Ficou famosa em 1989, quando o estudo Clean Air da NASA a listou entre as plantas que ajudam a filtrar compostos voláteis do ar."
  },
  {
    id: "p05", nome: "Zamioculca", cientifico: "Zamioculcas zamiifolia", emoji: "🌱", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRkcFiQweyfxhByiRYKV4R6szpuJ9TGF56XUUcgfNSsA&s=10",
    preco: 119.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz baixa a média", agua: "Regar a cada 20 dias", umidade: "Baixa",
    porte: "Médio (até 1 m)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Armazena água nos rizomas: esquecer de regar é melhor do que exagerar. Vive bem em escritórios com luz artificial. Seiva irritante — não indicada para casas com animais roedores de folhas.",
    historia: "Descoberta no Zanzibar e leste da África, foi comercializada em larga escala só a partir dos anos 1990 por viveiros holandeses. Na China ganhou o apelido de 'árvore da moeda de ouro' por simbolizar prosperidade."
  },
  {
    id: "p06", nome: "Lírio-da-paz", cientifico: "Spathiphyllum wallisii", emoji: "🕊️", imagem: "https://cdn.assets-casacor.tec.br/file/casacor-images-news/2024/07/spathiphyllum-4260803_1280.webp",
    preco: 89.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Sombra luminosa", agua: "Regar 2x por semana", umidade: "Alta",
    porte: "Médio (50 cm)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Avisa quando está com sede: murcha inteira e volta ao normal horas após a rega. Gosta de sombra luminosa e umidade. Contém oxalato de cálcio, então evite em casas com gatos que mordiscam.",
    historia: "Vinda das florestas úmidas da Colômbia e Venezuela, foi levada à Europa no século XIX. Sua espata branca virou símbolo internacional de paz e é a flor mais presente em ambientes de meditação."
  },
  {
    id: "p07", nome: "Suculenta Echeveria", cientifico: "Echeveria elegans", emoji: "🪴", imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 34.9, categoria: "Suculenta", ambiente: "Sol pleno",
    luz: "Sol direto 4–6 h por dia", agua: "Regar a cada 12 dias", umidade: "Baixa",
    porte: "Pequeno (12 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Planta de sol: quanto mais luz direta, mais intensas ficam as bordas rosadas. Detesta chuva forte e água acumulada na roseta. Atóxica, ideal para famílias com pets e crianças.",
    historia: "Nativa dos desertos semiáridos do México, leva o nome do ilustrador botânico Atanasio Echeverría, que documentou a flora mexicana na expedição real espanhola do século XVIII."
  },
  {
    id: "p08", nome: "Ficus Lyrata", cientifico: "Ficus lyrata", emoji: "🌳", imagem: "https://cdn.awsli.com.br/800x800/2772/2772039/produto/372166868/bambino-3-7fw8rm5889.jpg",
    preco: 249.9, categoria: "Árvore", ambiente: "Interno",
    luz: "Muita luz indireta", agua: "Regar a cada 7 dias", umidade: "Média",
    porte: "Grande (até 3 m)", dificuldade: "Difícil", petFriendly: false,
    resumo: "Exigente e dramática: odeia mudanças de lugar, correntes de ar frio e excesso de água. Quer muita claridade, mas sem sol batendo direto nas folhas. Seiva leitosa tóxica para animais.",
    historia: "Originária das florestas tropicais da África Ocidental, onde começa a vida como epífita sobre outra árvore. Tornou-se o símbolo da decoração escandinava dos anos 2010, presente em quase toda revista de arquitetura da década."
  },
  {
    id: "p09", nome: "Manjericão", cientifico: "Ocimum basilicum", emoji: "🌿", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_jBGQw3KbZco4WrZ3PQC2b0SzgPonHQp-GIRdkGgsmYBgYIFL6okckKkm&s=10",
    preco: 24.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto pela manhã", agua: "Regar todos os dias", umidade: "Média",
    porte: "Pequeno (40 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Quer sol da manhã e solo sempre levemente úmido. Chuva forte derruba as folhas, então prefira local coberto. Totalmente seguro para pets e ainda vai direto para o molho de tomate.",
    historia: "Cultivado há mais de 5.000 anos na Índia, onde é considerado sagrado. Chegou à Europa pelas rotas de especiarias e virou pilar da cozinha mediterrânea — o pesto genovês nasceu no século XIX."
  },
  {
    id: "p10", nome: "Peperômia-melancia", cientifico: "Peperomia argyreia", emoji: "🍉", imagem: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 59.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta média", agua: "Regar a cada 10 dias", umidade: "Média",
    porte: "Pequeno (25 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Folhas listradas que parecem casca de melancia. Gosta de luz suave e rega espaçada — as folhas guardam água. Atóxica, perfeita para apartamentos com gatos.",
    historia: "Encontrada nas matas do norte da América do Sul, incluindo a Amazônia brasileira. Cresce naturalmente no chão da floresta, à sombra de árvores gigantes, o que explica sua preferência por pouca luz."
  },
  {
    id: "p11", nome: "Antúrio Vermelho", cientifico: "Anthurium andraeanum", emoji: "❤️", imagem: "https://s2-casaejardim.glbimg.com/3RojmV7S3fMrdFq91TKmd6GjRqk=/0x0:1400x930/924x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_a0b7e59562ef42049f4e191fe476fe7d/internal_photos/bs/2023/A/L/nY1EynTYmRPHElm2498w/anturio-como-cuidar-planta-coracao-decoracao-paisagismo-3.jpg",
    preco: 99.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Luz indireta constante", agua: "Regar 2x por semana", umidade: "Alta",
    porte: "Médio (45 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Floresce o ano inteiro se tiver umidade e luz filtrada. Não gosta de vento seco nem de sol direto. Como toda arácea, é tóxica para cães e gatos.",
    historia: "Descrita na Colômbia em 1876 pelo botânico Édouard André, foi levada ao Havaí em 1889, onde o cultivo comercial transformou a ilha na maior exportadora mundial da flor."
  },
  {
    id: "p12", nome: "Cacto Mandacaru", cientifico: "Cereus jamacaru", emoji: "🌵", imagem: "https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 89.9, categoria: "Cacto", ambiente: "Sol pleno",
    luz: "Sol pleno o dia todo", agua: "Regar a cada 20 dias", umidade: "Baixa",
    porte: "Grande (até 3 m)", dificuldade: "Muito fácil", petFriendly: true,
    resumo: "Sol, sol e mais sol. Praticamente dispensa água no inverno e detesta chuva prolongada. Não é tóxico, mas os espinhos pedem cuidado com crianças e pets.",
    historia: "Símbolo da caatinga brasileira, o mandacaru floresce à noite em flores brancas polinizadas por morcegos. No sertão, dizem que quando ele floresce é sinal de que a seca vai acabar."
  },
  {
    id: "p13", nome: "Maranta-tricolor", cientifico: "Ctenanthe / Maranta leuconeura", emoji: "🎋", imagem: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 74.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Sombra luminosa", agua: "Manter úmida, água filtrada", umidade: "Alta",
    porte: "Pequeno (35 cm)", dificuldade: "Média", petFriendly: true,
    resumo: "Fecha as folhas à noite como se rezasse. Sensível a cloro — prefira água filtrada ou de chuva. Nada de sol direto. Segura para lares com animais.",
    historia: "Nativa das florestas úmidas do Brasil, recebeu o nome em homenagem ao médico veneziano Bartolomeo Maranta. O movimento noturno das folhas, chamado nictinastia, rendeu o apelido de 'planta-que-reza'."
  },
  {
    id: "p14", nome: "Lavanda", cientifico: "Lavandula angustifolia", emoji: "💜", imagem: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 44.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto 6 h+", agua: "Regar a cada 5 dias", umidade: "Baixa",
    porte: "Pequeno (50 cm)", dificuldade: "Média", petFriendly: true,
    resumo: "Precisa de muito sol e solo bem drenado. Chuva constante e umidade alta são seus maiores inimigos. Aroma calmante e segura para famílias com pets em pequenas quantidades.",
    historia: "Usada pelos romanos para perfumar banhos — 'lavare' significa lavar. Na Provença francesa, os campos de lavanda cultivados desde o século XIX se tornaram uma das paisagens mais fotografadas do mundo."
  },
  {
    id: "p15", nome: "Pilea Chinesa", cientifico: "Pilea peperomioides", emoji: "🪙", imagem: "https://www.jardineiro.net/wp-content/uploads/2019/07/Pilea_peperomioides_Chinese_money_plant.jpg",
    preco: 64.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta brilhante", agua: "Regar a cada 8 dias", umidade: "Média",
    porte: "Pequeno (30 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Folhas redondas de moeda que giram na direção da luz — vire o vaso semanalmente. Rega moderada. Atóxica e generosa: produz mudinhas o tempo todo.",
    historia: "Coletada nas montanhas de Yunnan, China, por um missionário norueguês em 1946. Por décadas circulou apenas entre amigos, passada de mão em mão como muda, antes de chegar aos viveiros comerciais nos anos 2010."
  },
  {
    id: "p16", nome: "Orquídea Phalaenopsis", cientifico: "Phalaenopsis amabilis", emoji: "🌸", imagem: "https://acdn-us.mitiendanube.com/stores/003/215/045/products/orquidea-dupla-084679ab81bf8e676717104467906539-1024-1024.webp",
    preco: 109.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Luz indireta suave", agua: "Molhar raízes 1x por semana", umidade: "Alta",
    porte: "Médio (60 cm)", dificuldade: "Média", petFriendly: true,
    resumo: "Não vive em terra: precisa de substrato de casca aerado. Odeia água parada no vaso e sol direto. Atóxica para cães e gatos, ótima escolha para quem tem bichos.",
    historia: "Descrita em 1750 nas ilhas da Indonésia, ganhou o nome 'mariposa' porque o naturalista Carl Blume a confundiu com um bando de borboletas ao observá-la de longe na floresta."
  },
  {
    id: "p17", nome: "Alocásia Orelha-de-elefante", cientifico: "Alocasia amazonica", emoji: "🐘", imagem: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 149.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar 2x por semana", umidade: "Muito alta",
    porte: "Médio (80 cm)", dificuldade: "Difícil", petFriendly: false,
    resumo: "Dramática e exigente: quer calor, umidade alta e nada de correntes de vento frio. Entra em dormência no inverno. Muito tóxica — evite se tiver pets.",
    historia: "Apesar do nome 'amazonica', é um híbrido criado em 1950 no viveiro Amazon Nursery, na Flórida, a partir de espécies asiáticas. O nome comercial pegou e nunca mais mudou."
  },
  {
    id: "p18", nome: "Rosa-do-deserto", cientifico: "Adenium obesum", emoji: "🌺", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsrBuM1rdV_slRL35UkrimMZPWAJgb7faGk0qnVy8-mdpw9Qm_uo5pMLw&s=10",
    preco: 139.9, categoria: "Suculenta", ambiente: "Sol pleno",
    luz: "Sol pleno direto", agua: "Regar a cada 10 dias", umidade: "Baixa",
    porte: "Médio (60 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Caudex grosso que guarda água e flores intensas no verão. Precisa de sol pleno e detesta chuva prolongada. Seiva altamente tóxica — não recomendada com pets ou crianças pequenas.",
    historia: "Cresce nas regiões áridas do Sahel africano e da península arábica. Tribos do leste da África usavam sua seiva em pontas de flecha de caça — o que explica o cuidado necessário no manejo."
  },
  {
    id: "p19", nome: "Jiboia-prateada", cientifico: "Scindapsus pictus", emoji: "🌿", imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 69.9, categoria: "Pendente", ambiente: "Interno",
    luz: "Luz indireta brilhante", agua: "Regar a cada 7–10 dias", umidade: "Média",
    porte: "Pendente (até 1,5 m)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Folhas aveludadas com manchas prateadas reluzentes. Regue apenas quando o solo secar na superfície.",
    historia: "Nativa do Sudeste Asiático, suas manchas prateadas refletem a pouca luz que chega ao chão das florestas tropicais."
  },
  {
    id: "p20", nome: "Calathea Orbifolia", cientifico: "Goeppertia orbifolia", emoji: "🍃", imagem: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 159.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta suave", agua: "Manter solo levemente úmido", umidade: "Muito alta",
    porte: "Médio (60 cm)", dificuldade: "Difícil", petFriendly: true,
    resumo: "Folhas grandes, arredondadas e com elegantes listras prateadas. Exige alta umidade ambiente e prefere água filtrada.",
    historia: "Originária da bacia amazônica na Bolívia, cresce sob a densa copa das árvores onde a umidade relativa do ar é constantemente elevada."
  },
  {
    id: "p21", nome: "Begônia-maculata", cientifico: "Begonia maculata", emoji: "⚪", imagem: "https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 89.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar a cada 5–7 dias", umidade: "Média a alta",
    porte: "Médio (50–70 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Folhas alongadas verdes com bolinhas brancas no verso avermelhado. Não molhe as folhas diretamente para evitar fungos.",
    historia: "Nativa do Brasil, foi introduzida na Europa e virou inspiração para designers de moda devido às suas bolinhas perfeitamente desenhadas."
  },
  {
    id: "p22", nome: "Colar-de-pérolas", cientifico: "Senecio rowleyanus", emoji: "🟢", imagem: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 49.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Muita luz indireta ou sol suave", agua: "Regar a cada 12–15 dias", umidade: "Baixa",
    porte: "Pendente (até 90 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Suculenta pendente com esferas verdes que lembram um colar. Precisa de ótima ventilação e solo muito bem drenado.",
    historia: "Encontrada nas áreas secas do sudoeste da África, suas folhas em formato de bolinhas minimizam a perda de água por evaporação."
  },
  {
    id: "p23", nome: "Hortelã-pimenta", cientifico: "Mentha x piperita", emoji: "🌱", imagem: "https://http2.mlstatic.com/D_NQ_NP_617285-MLB92401146480_092025-O.webp",
    preco: 19.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto 4–6 h por dia", agua: "Regar todos os dias", umidade: "Média",
    porte: "Pequeno (30 cm)", dificuldade: "Muito fácil", petFriendly: true,
    resumo: "Aromática e refrescante. Cresce rápido e adora umidade constante. Ótima para chás, sucos e sobremesas.",
    historia: "Um híbrido natural entre a menta aquática e a menta verde, cultivada desde a Europa antiga por suas propriedades medicinais e gastronômicas."
  },
  {
    id: "p24", nome: "Flor-de-maio", cientifico: "Schlumbergera truncata", emoji: "🌸", imagem: "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 45.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Luz indireta abundante", agua: "Regar a cada 8–10 dias", umidade: "Média",
    porte: "Pequeno (30 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Cacto epífito sem espinhos que floresce no outono e inverno. Seguro para animais de estimação e fácil de cuidar.",
    historia: "Nativa da Mata Atlântica no sudeste do Brasil, cresce sobre galhos de árvores e rochas em ambientes úmidos e sombreados."
  },
  {
    id: "p25", nome: "Guaimbê", cientifico: "Thaumatophyllum bipinnatifidum", emoji: "🪴", imagem: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 139.9, categoria: "Folhagem", ambiente: "Varanda",
    luz: "Meia-sombra ou sol matinal", agua: "Regar 2x por semana", umidade: "Média a alta",
    porte: "Grande (até 2 m)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Folhas recortadas e exuberantes com visual tropical marcante. Muito resistente e de rápido crescimento.",
    historia: "Típico das florestas tropicais da América do Sul, é uma das plantas favoritas do paisagista Roberto Burle Marx em seus projetos urbanos."
  },
  {
    id: "p26", nome: "Flor-de-cera", cientifico: "Hoya carnosa", emoji: "✨", imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 79.9, categoria: "Pendente", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar a cada 10–12 dias", umidade: "Média",
    porte: "Pendente (até 2 m)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Folhas espessas e duras que produzem cachos de flores cerosas com perfume adocicado ao final do dia.",
    historia: "Originária do leste da Ásia e Austrália, foi nomeada em homenagem ao botânico inglês Thomas Hoy no século XIX."
  },
  {
    id: "p27", nome: "Espada-de-santa-bárbara", cientifico: "Dracaena trifasciata 'Hahnii'", emoji: "🗡️", imagem: "https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 39.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Qualquer tipo de luz", agua: "Regar a cada 15–20 dias", umidade: "Baixa",
    porte: "Pequeno (20 cm)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Versão anã em formato de roseta compacto. Sobrevive a ambientes com pouca luz e regas bem espaçadas.",
    historia: "Surgiu como uma mutação natural da Espada-de-são-jorge nos anos 1930 em um viveiro na Flórida, conquistando espaços pequenos."
  },
  {
    id: "p28", nome: "Lança-de-são-jorge", cientifico: "Dracaena cylindrica", emoji: "🎋", imagem: "https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 84.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Luz média a sol suave", agua: "Regar a cada 15 dias", umidade: "Baixa",
    porte: "Médio (60 cm)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Hastes cilíndricas e eretas com design moderno e minimalista. Ideal para vasos altos e cantos de salas.",
    historia: "Nativa de Angola, possui fibras internas extremamente resistentes que eram utilizadas tradicionalmente na confecção de arcos de caça."
  },
  {
    id: "p29", nome: "Alecrim", cientifico: "Salvia rosmarinus", emoji: "🌿", imagem: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 22.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto 6 h por dia", agua: "Regar a cada 4–5 dias", umidade: "Baixa",
    porte: "Médio (60 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Arbusto aromático que adora sol pleno e solo seco entre as regas. Excelente tempero culinário e estimulante natural.",
    historia: "Nativo da região do Mediterrâneo, seu nome vem do latim 'ros marinus', que significa 'orvalho do mar'."
  },
  {
    id: "p30", nome: "Orelha-de-coelho", cientifico: "Opuntia microdasys", emoji: "🌵", imagem: "https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&h=600&q=80",
    preco: 29.9, categoria: "Cacto", ambiente: "Sol pleno",
    luz: "Sol pleno direto", agua: "Regar a cada 20 dias", umidade: "Baixa",
    porte: "Pequeno (25 cm)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Formato divertido que lembra orelhas de coelho. Não possui espinhos longos, mas pequenos tufos macios que requerem cuidado.",
    historia: "Originário das regiões centrais do México, adaptado para sobreviver a longos períodos de seca em altitudes elevadas."
  }
];

const CURSOS = [
  {
    id: "c1", titulo: "Fundamentos: como não matar sua primeira planta", nivel: "Iniciante",
    duracao: "48 min", emoji: "🌱",
    descricao: "Luz, rega, substrato e vaso: os quatro pilares que resolvem 90% dos problemas de quem está começando.",
    link: "https://www.youtube.com/results?search_query=cuidados+basicos+plantas+iniciantes",
    aulas: ["Entendendo a luz da sua casa", "A rega certa para cada tipo", "Substratos e drenagem", "Escolhendo o vaso ideal"],
    brotos: 120
  },
  {
    id: "c2", titulo: "Propagação: multiplicando suas plantas de graça", nivel: "Intermediário",
    duracao: "1 h 05", emoji: "✂️",
    descricao: "Estaquia, divisão de touceira, propagação na água e em esfagno. Transforme uma planta em dez.",
    link: "https://www.youtube.com/results?search_query=como+fazer+mudas+de+plantas+propagacao",
    aulas: ["Ferramentas e higiene do corte", "Estaquia na água", "Divisão de touceira", "Enraizamento em esfagno"],
    brotos: 150
  },
  {
    id: "c3", titulo: "Pragas e doenças: diagnóstico e tratamento natural", nivel: "Intermediário",
    duracao: "55 min", emoji: "🐛",
    descricao: "Cochonilha, ácaro, fungo gnat e oídio: identifique cedo e trate com receitas caseiras eficazes.",
    link: "https://www.youtube.com/results?search_query=pragas+em+plantas+tratamento+natural",
    aulas: ["Identificando as 6 pragas comuns", "Óleo de neem na prática", "Calda de sabão e alho", "Prevenção e quarentena"],
    brotos: 140
  },
  {
    id: "c4", titulo: "Horta em apartamento: do tempero ao prato", nivel: "Iniciante",
    duracao: "42 min", emoji: "🥬",
    descricao: "Monte uma horta produtiva em uma janela de 60 cm com temperos, folhas e microverdes.",
    link: "https://www.youtube.com/results?search_query=horta+em+apartamento+passo+a+passo",
    aulas: ["Planejando o espaço", "As 8 melhores espécies", "Adubação orgânica caseira", "Colheita contínua"],
    brotos: 110
  },
  {
    id: "c5", titulo: "Paisagismo de interiores: composição e estética", nivel: "Avançado",
    duracao: "1 h 20", emoji: "🏡",
    descricao: "Camadas, texturas, repetição e ponto focal — princípios de design aplicados ao verde dentro de casa.",
    link: "https://www.youtube.com/results?search_query=paisagismo+de+interiores+plantas+decoracao",
    aulas: ["Leitura do ambiente", "Regra dos três níveis", "Cor e textura foliar", "Vasos como elemento de design"],
    brotos: 200
  },
  {
    id: "c6", titulo: "Substratos, adubos e nutrição avançada", nivel: "Avançado",
    duracao: "1 h 10", emoji: "🧪",
    descricao: "NPK, micronutrientes, pH e como formular seu próprio substrato para cada família de planta.",
    link: "https://www.youtube.com/results?search_query=substrato+e+adubacao+de+plantas+npk",
    aulas: ["Lendo um rótulo NPK", "pH e disponibilidade nutricional", "Receitas de substrato", "Calendário de adubação"],
    brotos: 180
  }
];

const RECOMPENSAS = [
  { id: "r1", nome: "Frete grátis sem valor mínimo", desc: "Zera o frete do pedido, para qualquer região.", custo: 300, emoji: "🚚", tipo: "frete" },
  { id: "r2", nome: "Cupom R$ 20 de desconto", desc: "Abate R$ 20 do subtotal do carrinho.", custo: 250, emoji: "🏷️", tipo: "desconto", valor: 20 },
  { id: "r3", nome: "Cupom R$ 50 de desconto", desc: "Abate R$ 50 do subtotal do carrinho.", custo: 550, emoji: "💸", tipo: "desconto", valor: 50 },
  { id: "r4", nome: "10% off no pedido", desc: "Desconto percentual sobre o subtotal.", custo: 400, emoji: "📉", tipo: "percentual", valor: 10 },
  { id: "r5", nome: "Kit adubo orgânico de brinde", desc: "Um pote de 500 g vai junto no pedido.", custo: 200, emoji: "🧴", tipo: "brinde" },
  { id: "r6", nome: "Muda surpresa de brinde", desc: "Uma mudinha escolhida pelo nosso viveiro.", custo: 350, emoji: "🌿", tipo: "brinde" },
  { id: "r7", nome: "Embalagem presente premium", desc: "Caixa kraft, laço de juta e cartão manuscrito.", custo: 150, emoji: "🎁", tipo: "brinde" },
  { id: "r8", nome: "Entrega expressa gratuita", desc: "Upgrade para envio expresso sem custo.", custo: 500, emoji: "⚡", tipo: "expresso" }
];

const FAQ = [
  { q: "Como as plantas são embaladas para o transporte?", a: "Cada planta viaja com o torrão protegido por filme biodegradável, tutor interno e caixa de papelão dupla com respiros. Espécies frágeis levam berço de papel picado reciclado." },
  { q: "E se a planta chegar danificada?", a: "Você tem 7 dias corridos para nos enviar fotos pela área de pedidos. Reenviamos uma nova planta ou devolvemos 100% do valor, sem custo de devolução." },
  { q: "O que são os Brotos?", a: "São os pontos do nosso programa de fidelidade. Você ganha 1 Broto a cada R$ 1 gasto, 50 Brotos por avaliação de compra e um bônus ao concluir cada curso. Troque por frete grátis, cupons e brindes direto no carrinho." },
  { q: "Os Brotos expiram?", a: "Não. Enquanto sua conta estiver ativa, seus Brotos ficam acumulados sem prazo de validade." },
  { q: "Como funciona o cálculo de frete?", a: "Ao informar seu CEP, estimamos prazo e valor com base na região, no peso somado das plantas e na modalidade escolhida (padrão ou expressa). Pedidos acima de R$ 299 têm frete padrão grátis." },
  { q: "Quais formas de pagamento vocês aceitam?", a: "Pix com aprovação imediata e 5% de desconto, cartão de crédito em até 12x (sem juros até 6x) e boleto bancário com vencimento em 3 dias úteis." },
  { q: "Como faço para enviar uma planta de presente?", a: "No carrinho, ative a opção Presente. Você escreve a mensagem do cartão, informa o nome de quem recebe e nós ocultamos o valor da nota que acompanha o pacote." },
  { q: "Os cursos são pagos?", a: "Não. Todos os cursos da plataforma são gratuitos, hospedados no YouTube. Ao marcar todas as aulas como concluídas você emite um certificado nominal e ainda recebe Brotos." },
  { q: "O certificado tem validade oficial?", a: "É um certificado de participação em curso livre, útil para portfólio e horas complementares em algumas instituições. Não substitui formação técnica reconhecida pelo MEC." },
  { q: "Como sei se uma planta é segura para meu pet?", a: "Todo item do catálogo traz a etiqueta Pet friendly ou Tóxica para pets. Use também o filtro Seguro para pets no topo do catálogo." },
  { q: "Vocês entregam em todo o Brasil?", a: "Sim. Sul e Sudeste em 2 a 5 dias úteis, Centro-Oeste e Nordeste em 4 a 8 dias, Norte em 6 a 12 dias úteis." },
  { q: "Posso alterar meu pedido depois de finalizar?", a: "Enquanto o status estiver como Em preparo, entre em contato pela área de pedidos e ajustamos itens ou endereço sem custo." }
];

// Tabela fictícia de frete por região (prefixo de CEP)
const REGIOES_FRETE = [
  { faixa: [1000000, 19999999], nome: "São Paulo", base: 18.9, prazo: [2, 4] },
  { faixa: [20000000, 28999999], nome: "Rio de Janeiro", base: 22.9, prazo: [2, 5] },
  { faixa: [29000000, 29999999], nome: "Espírito Santo", base: 26.9, prazo: [3, 6] },
  { faixa: [30000000, 39999999], nome: "Minas Gerais", base: 24.9, prazo: [3, 6] },
  { faixa: [40000000, 48999999], nome: "Bahia", base: 34.9, prazo: [5, 9] },
  { faixa: [49000000, 56999999], nome: "Nordeste (SE/PE/AL)", base: 37.9, prazo: [5, 10] },
  { faixa: [57000000, 63999999], nome: "Nordeste (AL/CE)", base: 39.9, prazo: [6, 10] },
  { faixa: [64000000, 69999999], nome: "Norte", base: 49.9, prazo: [7, 13] },
  { faixa: [70000000, 76999999], nome: "Centro-Oeste (DF/GO)", base: 29.9, prazo: [4, 7] },
  { faixa: [77000000, 79999999], nome: "Centro-Oeste (TO/MS)", base: 33.9, prazo: [5, 8] },
  { faixa: [80000000, 87999999], nome: "Paraná", base: 23.9, prazo: [3, 6] },
  { faixa: [88000000, 89999999], nome: "Santa Catarina", base: 25.9, prazo: [3, 6] },
  { faixa: [90000000, 99999999], nome: "Rio Grande do Sul", base: 28.9, prazo: [4, 7] }
];
