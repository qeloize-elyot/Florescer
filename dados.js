/* =========================================================
   Florescer — Base de dados (catálogo, cursos, FAQ, recompensas)
   ========================================================= */

const CATALOGO = [
  {
    id: "p01", nome: "Costela-de-adão", cientifico: "Monstera deliciosa", emoji: "🌿", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNs0FblG7834ztxo4dTr7EOxh8S6bvXHaE0caqNFOJkg&s=10",
    preco: 129.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar a cada 5–7 dias", umidade: "Média a alta",
    porte: "Grande (até 2,5 m)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Adora luz filtrada e detesta sol direto no meio do dia. Gosta de rega regular, mas sem encharcar: espere o dedo afundar 3 cm no substrato seco. Aprecia umidade — borrifar as folhas em dias secos deixa ela feliz.",
    historia: "Nativa das florestas tropicais do sul do México e da Guatemala, a Monstera cresce escalando troncos em busca de luz. Seus furos característicos evoluíram para deixar a luz e o vento passarem até as folhas de baixo. Virou ícone do design modernista dos anos 1950 e nunca mais saiu de moda."
  },
  {
    id: "p02", nome: "Espada-de-são-jorge", cientifico: "Dracaena trifasciata", emoji: "🗡️", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKbLpDuXFiuUJzc0Az6UnZ80rn9vjC6BA9TWfNf1cuKA&s=10",
    preco: 79.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Tolera meia-sombra e sol suave", agua: "Regar a cada 15 dias", umidade: "Baixa",
    porte: "Médio (60–90 cm)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "A planta mais resistente do catálogo: sobrevive ao esquecimento. Prefere pouca água e detesta chuva constante ou solo encharcado — a raiz apodrece rápido. Aceita desde sombra até sol filtrado.",
    historia: "Originária da África Ocidental, era usada para extrair fibras de corda. No Brasil ganhou o nome de Espada-de-São-Jorge pela crença popular de proteção contra o mau-olhado, sempre plantada na entrada das casas."
  },
  {
    id: "p03", nome: "Samambaia-americana", cientifico: "Nephrolepis exaltata", emoji: "🌾", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6Y4ZDJQI9apkLhHBYPbzKY48dmWoLP5lD1Hw7poShng&s=10",
    preco: 69.9, categoria: "Folhagem", ambiente: "Varanda",
    luz: "Meia-sombra, nunca sol direto", agua: "Manter sempre úmida", umidade: "Alta",
    porte: "Médio pendente", dificuldade: "Média", petFriendly: true,
    resumo: "Ama chuva fina e umidade constante — é a planta de banheiro por excelência. Odeia sol direto, que queima as folhas em horas. Segura para lares com cães e gatos.",
    historia: "As samambaias existem há mais de 350 milhões de anos, muito antes das plantas com flores. A variedade Bostoniensis surgiu por acaso em um carregamento enviado a Boston em 1894 e virou febre na era vitoriana."
  },
  {
    id: "p04", nome: "Jiboia-verde", cientifico: "Epipremnum aureum", emoji: "🍃", imagem: "https://blog.plantie.com.br/wp-content/uploads/2022/06/como-cuidar-da-jiboia-verde.jpg",
    preco: 54.9, categoria: "Pendente", ambiente: "Interno",
    luz: "Luz indireta, tolera sombra", agua: "Regar a cada 7 dias", umidade: "Média",
    porte: "Pendente (até 2 m)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Cresce em quase qualquer lugar, até em copo d'água. Gosta de luz indireta e rega moderada. Tóxica se mastigada — mantenha longe de pets curiosos e crianças pequenas.",
    historia: "Nativa da Polinésia Francesa, escapou de jardins e hoje cobre florestas inteiras no sudeste asiático. Ficou famosa em 1989, quando o estudo Clean Air da NASA a listou entre as plantas que ajudam a filtrar compostos voláteis do ar."
  },
  {
    id: "p05", nome: "Zamioculca", cientifico: "Zamioculcas zamiifolia", emoji: "🌱", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_U3ZnfUNvpiaxupfAnCfvsE2hNNNBWP-Co_-11Whccg&s=10",
    preco: 119.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz baixa a média", agua: "Regar a cada 20 dias", umidade: "Baixa",
    porte: "Médio (até 1 m)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Armazena água nos rizomas: esquecer de regar é melhor do que exagerar. Vive bem em escritórios com luz artificial. Seiva irritante — não indicada para casas com animais roedores de folhas.",
    historia: "Descoberta no Zanzibar e leste da África, foi comercializada em larga escala só a partir dos anos 1990 por viveiros holandeses. Na China ganhou o apelido de 'árvore da moeda de ouro' por simbolizar prosperidade."
  },
  {
    id: "p06", nome: "Lírio-da-paz", cientifico: "Spathiphyllum wallisii", emoji: "🕊️", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBfoQUjTotBqEGK7rUDDshSf1MOEcOPrPHy-C-w8nBbw&s=10",
    preco: 89.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Sombra luminosa", agua: "Regar 2x por semana", umidade: "Alta",
    porte: "Médio (50 cm)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Avisa quando está com sede: murcha inteira e volta ao normal horas após a rega. Gosta de sombra luminosa e umidade. Contém oxalato de cálcio, então evite em casas com gatos que mordiscam.",
    historia: "Vinda das florestas úmidas da Colômbia e Venezuela, foi levada à Europa no século XIX. Sua espata branca virou símbolo internacional de paz e é a flor mais presente em ambientes de meditação."
  },
  {
    id: "p07", nome: "Suculenta Echeveria", cientifico: "Echeveria elegans", emoji: "🪴", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzDSWlubpMpAKRuypITlS8Pj-7Gh72S1D-IyF0MKQw9Q&s=10",
    preco: 34.9, categoria: "Suculenta", ambiente: "Sol pleno",
    luz: "Sol direto 4–6 h por dia", agua: "Regar a cada 12 dias", umidade: "Baixa",
    porte: "Pequeno (12 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Planta de sol: quanto mais luz direta, mais intensas ficam as bordas rosadas. Detesta chuva forte e água acumulada na roseta. Atóxica, ideal para famílias com pets e crianças.",
    historia: "Nativa dos desertos semiáridos do México, leva o nome do ilustrador botânico Atanasio Echeverría, que documentou a flora mexicana na expedição real espanhola do século XVIII."
  },
  {
    id: "p08", nome: "Ficus Lyrata", cientifico: "Ficus lyrata", emoji: "🌳", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZWkX--GbhO6N1XnSivhg_Yi4HHpMQCVyYX0diuOqrag&s=10",
    preco: 249.9, categoria: "Árvore", ambiente: "Interno",
    luz: "Muita luz indireta", agua: "Regar a cada 7 dias", umidade: "Média",
    porte: "Grande (até 3 m)", dificuldade: "Difícil", petFriendly: false,
    resumo: "Exigente e dramática: odeia mudanças de lugar, correntes de ar frio e excesso de água. Quer muita claridade, mas sem sol batendo direto nas folhas. Seiva leitosa tóxica para animais.",
    historia: "Originária das florestas tropicais da África Ocidental, onde começa a vida como epífita sobre outra árvore. Tornou-se o símbolo da decoração escandinava dos anos 2010, presente em quase toda revista de arquitetura da década."
  },
  {
    id: "p09", nome: "Manjericão", cientifico: "Ocimum basilicum", emoji: "🌿", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2Vyu5LdqoOCurH9HT6DrK987GoPW5CwDec34n89n8wQ&s=10",
    preco: 24.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto pela manhã", agua: "Regar todos os dias", umidade: "Média",
    porte: "Pequeno (40 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Quer sol da manhã e solo sempre levemente úmido. Chuva forte derruba as folhas, então prefira local coberto. Totalmente seguro para pets e ainda vai direto para o molho de tomate.",
    historia: "Cultivado há mais de 5.000 anos na Índia, onde é considerado sagrado. Chegou à Europa pelas rotas de especiarias e virou pilar da cozinha mediterrânea — o pesto genovês nasceu no século XIX."
  },
  {
    id: "p10", nome: "Peperômia-melancia", cientifico: "Peperomia argyreia", emoji: "🍉", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJGN2y-SCvuLWTbU6lwEe3k8B91aYEEenrUkCdJrdg5g&s=10",
    preco: 59.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta média", agua: "Regar a cada 10 dias", umidade: "Média",
    porte: "Pequeno (25 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Folhas listradas que parecem casca de melancia. Gosta de luz suave e rega espaçada — as folhas guardam água. Atóxica, perfeita para apartamentos com gatos.",
    historia: "Encontrada nas matas do norte da América do Sul, incluindo a Amazônia brasileira. Cresce naturalmente no chão da floresta, à sombra de árvores gigantes, o que explica sua preferência por pouca luz."
  },
  {
    id: "p11", nome: "Antúrio Vermelho", cientifico: "Anthurium andraeanum", emoji: "❤️", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRw6wVvr8l4JCbTgq3bPCAlePuG0aF5eEhLBWFSwiDOsQ&s=10",
    preco: 99.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Luz indireta constante", agua: "Regar 2x por semana", umidade: "Alta",
    porte: "Médio (45 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Floresce o ano inteiro se tiver umidade e luz filtrada. Não gosta de vento seco nem de sol direto. Como toda arácea, é tóxica para cães e gatos.",
    historia: "Descrita na Colômbia em 1876 pelo botânico Édouard André, foi levada ao Havaí em 1889, onde o cultivo comercial transformou a ilha na maior exportadora mundial da flor."
  },
  {
    id: "p12", nome: "Cacto Mandacaru", cientifico: "Cereus jamacaru", emoji: "🌵", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU0fE5AqRTBUAQtqTodCk0RvcWlC6J1RnrSjf2mnG0Sg&s=10",
    preco: 89.9, categoria: "Cacto", ambiente: "Sol pleno",
    luz: "Sol pleno o dia todo", agua: "Regar a cada 20 dias", umidade: "Baixa",
    porte: "Grande (até 3 m)", dificuldade: "Muito fácil", petFriendly: true,
    resumo: "Sol, sol e mais sol. Praticamente dispensa água no inverno e detesta chuva prolongada. Não é tóxico, mas os espinhos pedem cuidado com crianças e pets.",
    historia: "Símbolo da caatinga brasileira, o mandacaru floresce à noite em flores brancas polinizadas por morcegos. No sertão, dizem que quando ele floresce é sinal de que a seca vai acabar."
  },
  {
    id: "p13", nome: "Maranta-tricolor", cientifico: "Ctenanthe / Maranta leuconeura", emoji: "🎋", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbPM76gnBHc4VsBgCgfyrzaAn41Rq_a6LMK4mFD5KCWw&s=10",
    preco: 74.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Sombra luminosa", agua: "Manter úmida, água filtrada", umidade: "Alta",
    porte: "Pequeno (35 cm)", dificuldade: "Média", petFriendly: true,
    resumo: "Fecha as folhas à noite como se rezasse. Sensível a cloro — prefira água filtrada ou de chuva. Nada de sol direto. Segura para lares com animais.",
    historia: "Nativa das florestas úmidas do Brasil, recebeu o nome em homenagem ao médico veneziano Bartolomeo Maranta. O movimento noturno das folhas, chamado nictinastia, rendeu o apelido de 'planta-que-reza'."
  },
  {
    id: "p14", nome: "Lavanda", cientifico: "Lavandula angustifolia", emoji: "💜", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaMPJcL8I9jtE7MPEiaZGBjZ70FyqyPwqOZrKyPsu3jg&s=10",
    preco: 44.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto 6 h+", agua: "Regar a cada 5 dias", umidade: "Baixa",
    porte: "Pequeno (50 cm)", dificuldade: "Média", petFriendly: true,
    resumo: "Precisa de muito sol e solo bem drenado. Chuva constante e umidade alta são seus maiores inimigos. Aroma calmante e segura para famílias com pets em pequenas quantidades.",
    historia: "Usada pelos romanos para perfumar banhos — 'lavare' significa lavar. Na Provença francesa, os campos de lavanda cultivados desde o século XIX se tornaram uma das paisagens mais fotografadas do mundo."
  },
  {
    id: "p15", nome: "Pilea Chinesa", cientifico: "Pilea peperomioides", emoji: "🪙", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDOmhLD3-SwmSeDomLWnhUUmNsAylOZGpr3--Znxk3xg&s=10",
    preco: 64.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta brilhante", agua: "Regar a cada 8 dias", umidade: "Média",
    porte: "Pequeno (30 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Folhas redondas de moeda que giram na direção da luz — vire o vaso semanalmente. Rega moderada. Atóxica e generosa: produz mudinhas o tempo todo.",
    historia: "Coletada nas montanhas de Yunnan, China, por um missionário norueguês em 1946. Por décadas circulou apenas entre amigos, passada de mão em mão como muda, antes de chegar aos viveiros comerciais nos anos 2010."
  },
  {
    id: "p16", nome: "Orquídea Phalaenopsis", cientifico: "Phalaenopsis amabilis", emoji: "🌸", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa7ctbkP_qmj5R9gn8BFfqujRP7eqSsh4AWKW-pH33XQ&s=10",
    preco: 109.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Luz indireta suave", agua: "Molhar raízes 1x por semana", umidade: "Alta",
    porte: "Médio (60 cm)", dificuldade: "Média", petFriendly: true,
    resumo: "Não vive em terra: precisa de substrato de casca aerado. Odeia água parada no vaso e sol direto. Atóxica para cães e gatos, ótima escolha para quem tem bichos.",
    historia: "Descrita em 1750 nas ilhas da Indonésia, ganhou o nome 'mariposa' porque o naturalista Carl Blume a confundiu com um bando de borboletas ao observá-la de longe na floresta."
  },
  {
    id: "p17", nome: "Alocásia Orelha-de-elefante", cientifico: "Alocasia amazonica", emoji: "🐘", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBesWgwXb1oEXyymjTNN3fKN1rYov5bqaiqOjykd0KFw&s=10",
    preco: 149.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar 2x por semana", umidade: "Muito alta",
    porte: "Médio (80 cm)", dificuldade: "Difícil", petFriendly: false,
    resumo: "Dramática e exigente: quer calor, umidade alta e nada de correntes de vento frio. Entra em dormência no inverno. Muito tóxica — evite se tiver pets.",
    historia: "Apesar do nome 'amazonica', é um híbrido criado em 1950 no viveiro Amazon Nursery, na Flórida, a partir de espécies asiáticas. O nome comercial pegou e nunca mais mudou."
  },
  {
    id: "p18", nome: "Rosa-do-deserto", cientifico: "Adenium obesum", emoji: "🌺", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSktbHDbjbqKh4y1p3U3yEVvvCevtwTI3bZ6DEccpIIlQ&s=10",
    preco: 139.9, categoria: "Suculenta", ambiente: "Sol pleno",
    luz: "Sol pleno direto", agua: "Regar a cada 10 dias", umidade: "Baixa",
    porte: "Médio (60 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Caudex grosso que guarda água e flores intensas no verão. Precisa de sol pleno e detesta chuva prolongada. Seiva altamente tóxica — não recomendada com pets ou crianças pequenas.",
    historia: "Cresce nas regiões áridas do Sahel africano e da península arábica. Tribos do leste da África usavam sua seiva em pontas de flecha de caça — o que explica o cuidado necessário no manejo."
  },
  {
    id: "p19", nome: "Jiboia-prateada", cientifico: "Scindapsus pictus", emoji: "🌿", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_bwxSUjlEvAKC2dFepl4-FSSG0OEujnKUoYHd3p8hUQ&s=10",
    preco: 69.9, categoria: "Pendente", ambiente: "Interno",
    luz: "Luz indireta brilhante", agua: "Regar a cada 7–10 dias", umidade: "Média",
    porte: "Pendente (até 1,5 m)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Folhas aveludadas com manchas prateadas reluzentes. Regue apenas quando o solo secar na superfície.",
    historia: "Nativa do Sudeste Asiático, suas manchas prateadas refletem a pouca luz que chega ao chão das florestas tropicais."
  },
  {
    id: "p20", nome: "Calathea Orbifolia", cientifico: "Goeppertia orbifolia", emoji: "🍃", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTziy-ums41VuSrDJt0xaHfxQeYWI7B0v9YUS4xiCaUfg&s=10",
    preco: 159.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta suave", agua: "Manter solo levemente úmido", umidade: "Muito alta",
    porte: "Médio (60 cm)", dificuldade: "Difícil", petFriendly: true,
    resumo: "Folhas grandes, arredondadas e com elegantes listras prateadas. Exige alta umidade ambiente e prefere água filtrada.",
    historia: "Originária da bacia amazônica na Bolívia, cresce sob a densa copa das árvores onde a umidade relativa do ar é constantemente elevada."
  },
  {
    id: "p21", nome: "Begônia-maculata", cientifico: "Begonia maculata", emoji: "⚪", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa_xPQWCmlB0zz5d-hUL647KMquVPMEySgkks94QmTtg&s=10",
    preco: 89.9, categoria: "Folhagem", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar a cada 5–7 dias", umidade: "Média a alta",
    porte: "Médio (50–70 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Folhas alongadas verdes com bolinhas brancas no verso avermelhado. Não molhe as folhas diretamente para evitar fungos.",
    historia: "Nativa do Brasil, foi introduzida na Europa e virou inspiração para designers de moda devido às suas bolinhas perfeitamente desenhadas."
  },
  {
    id: "p22", nome: "Colar-de-pérolas", cientifico: "Senecio rowleyanus", emoji: "🟢", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFxlSSHrV6AyOvoqOJRX1n3BOpDjp2IoonzwWVRGMV5A&s",
    preco: 49.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Muita luz indireta ou sol suave", agua: "Regar a cada 12–15 dias", umidade: "Baixa",
    porte: "Pendente (até 90 cm)", dificuldade: "Média", petFriendly: false,
    resumo: "Suculenta pendente com esferas verdes que lembram um colar. Precisa de ótima ventilação e solo muito bem drenado.",
    historia: "Encontrada nas áreas secas do sudoeste da África, suas folhas em formato de bolinhas minimizam a perda de água por evaporação."
  },
  {
    id: "p23", nome: "Hortelã-pimenta", cientifico: "Mentha x piperita", emoji: "🌱", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8d__w3Nkw-7wRC-FRhmL3eiiHEE11xyQN4FuXqF9dDQ&s=10",
    preco: 19.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto 4–6 h por dia", agua: "Regar todos os dias", umidade: "Média",
    porte: "Pequeno (30 cm)", dificuldade: "Muito fácil", petFriendly: true,
    resumo: "Aromática e refrescante. Cresce rápido e adora umidade constante. Ótima para chás, sucos e sobremesas.",
    historia: "Um híbrido natural entre a menta aquática e a menta verde, cultivada desde a Europa antiga por suas propriedades medicinais e gastronômicas."
  },
  {
    id: "p24", nome: "Flor-de-maio", cientifico: "Schlumbergera truncata", emoji: "🌸", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP98dpv_oeqLLGb_zfdHW2ubCOSQ_PKLGoE1vLX8BKpQ&s=10",
    preco: 45.9, categoria: "Florífera", ambiente: "Interno",
    luz: "Luz indireta abundante", agua: "Regar a cada 8–10 dias", umidade: "Média",
    porte: "Pequeno (30 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Cacto epífito sem espinhos que floresce no outono e inverno. Seguro para animais de estimação e fácil de cuidar.",
    historia: "Nativa da Mata Atlântica no sudeste do Brasil, cresce sobre galhos de árvores e rochas em ambientes úmidos e sombreados."
  },
  {
    id: "p25", nome: "Guaimbê", cientifico: "Thaumatophyllum bipinnatifidum", emoji: "🪴", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWkkMlOb_gy213J9DYuXEYH5OpKFoWE-_BlbEf_9IE8Q&s=10",
    preco: 139.9, categoria: "Folhagem", ambiente: "Varanda",
    luz: "Meia-sombra ou sol matinal", agua: "Regar 2x por semana", umidade: "Média a alta",
    porte: "Grande (até 2 m)", dificuldade: "Fácil", petFriendly: false,
    resumo: "Folhas recortadas e exuberantes com visual tropical marcante. Muito resistente e de rápido crescimento.",
    historia: "Típico das florestas tropicais da América do Sul, é uma das plantas favoritas do paisagista Roberto Burle Marx em seus projetos urbanos."
  },
  {
    id: "p26", nome: "Flor-de-cera", cientifico: "Hoya carnosa", emoji: "✨", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPtM0qSl2PnsMvbfB2N4pQGL0lDUi9C-LwgJL7YXT66A&s=10",
    preco: 79.9, categoria: "Pendente", ambiente: "Interno",
    luz: "Luz indireta forte", agua: "Regar a cada 10–12 dias", umidade: "Média",
    porte: "Pendente (até 2 m)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Folhas espessas e duras que produzem cachos de flores cerosas com perfume adocicado ao final do dia.",
    historia: "Originária do leste da Ásia e Austrália, foi nomeada em homenagem ao botânico inglês Thomas Hoy no século XIX."
  },
  {
    id: "p27", nome: "Espada-de-santa-bárbara", cientifico: "Dracaena trifasciata 'Hahnii'", emoji: "🗡️", imagem: "data:image/jpeg;base64,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",
    preco: 39.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Qualquer tipo de luz", agua: "Regar a cada 15–20 dias", umidade: "Baixa",
    porte: "Pequeno (20 cm)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Versão anã em formato de roseta compacto. Sobrevive a ambientes com pouca luz e regas bem espaçadas.",
    historia: "Surgiu como uma mutação natural da Espada-de-são-jorge nos anos 1930 em um viveiro na Flórida, conquistando espaços pequenos."
  },
  {
    id: "p28", nome: "Lança-de-são-jorge", cientifico: "Dracaena cylindrica", emoji: "🎋", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkyssojhVnhdRaWLoAlU75sCbBaw-RhNli-hw4X7zt-Q&s=10",
    preco: 84.9, categoria: "Suculenta", ambiente: "Interno",
    luz: "Luz média a sol suave", agua: "Regar a cada 15 dias", umidade: "Baixa",
    porte: "Médio (60 cm)", dificuldade: "Muito fácil", petFriendly: false,
    resumo: "Hastes cilíndricas e eretas com design moderno e minimalista. Ideal para vasos altos e cantos de salas.",
    historia: "Nativa de Angola, possui fibras internas extremamente resistentes que eram utilizadas tradicionalmente na confecção de arcos de caça."
  },
  {
    id: "p29", nome: "Alecrim", cientifico: "Salvia rosmarinus", emoji: "🌿", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrA3QKTMWkG-aID7dGaGCnz6Y3kFoy2Jg4GlaYSdKB1Q&s=10",
    preco: 22.9, categoria: "Comestível", ambiente: "Sol pleno",
    luz: "Sol direto 6 h por dia", agua: "Regar a cada 4–5 dias", umidade: "Baixa",
    porte: "Médio (60 cm)", dificuldade: "Fácil", petFriendly: true,
    resumo: "Arbusto aromático que adora sol pleno e solo seco entre as regas. Excelente tempero culinário e estimulante natural.",
    historia: "Nativo da região do Mediterrâneo, seu nome vem do latim 'ros marinus', que significa 'orvalho do mar'."
  },
  {
    id: "p30", nome: "Orelha-de-coelho", cientifico: "Opuntia microdasys", emoji: "🌵", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkgScHzPKQi2MVr176EQKsggd-iS9LJ2xmZ93Ze4TWkg&s=10",
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
