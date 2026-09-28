window.IF_DATA = {
  states: [
    ['AC','Acre','IFAC'],['AL','Alagoas','IFAL'],['AP','Amapá','IFAP'],['AM','Amazonas','IFAM'],
    ['BA','Bahia','IFBA / IF Baiano'],['CE','Ceará','IFCE'],['DF','Distrito Federal','IFB'],
    ['ES','Espírito Santo','IFES'],['GO','Goiás','IFG / IF Goiano'],['MA','Maranhão','IFMA'],
    ['MT','Mato Grosso','IFMT'],['MS','Mato Grosso do Sul','IFMS'],['MG','Minas Gerais','IFMG / IFSULDEMINAS / IFTM / IFNMG / IF Sudeste MG'],
    ['PA','Pará','IFPA'],['PB','Paraíba','IFPB'],['PR','Paraná','IFPR'],['PE','Pernambuco','IFPE / IF Sertão-PE'],
    ['PI','Piauí','IFPI'],['RJ','Rio de Janeiro','IFRJ / IFF'],['RN','Rio Grande do Norte','IFRN'],
    ['RS','Rio Grande do Sul','IFRS / IFSul / IFFar'],['RO','Rondônia','IFRO'],['RR','Roraima','IFRR'],
    ['SC','Santa Catarina','IFSC / IFC'],['SP','São Paulo','IFSP'],['SE','Sergipe','IFS'],['TO','Tocantins','IFTO']
  ],
  institutions: {
    RS: ['IFRS — Instituto Federal do Rio Grande do Sul','IFSul — Instituto Federal Sul-rio-grandense','IFFar — Instituto Federal Farroupilha'],
    SC: ['IFSC — Instituto Federal de Santa Catarina','IFC — Instituto Federal Catarinense']
  },
  sources: {
    RS: [
      {institution:'IFRS',title:'Provas e gabaritos anteriores',detail:'Cursos integrados, subsequentes e superiores · 2014–2026',url:'https://ingresso.ifrs.edu.br/2027/provas-e-gabaritos-anteriores/',verified:true},
      {institution:'MEC',title:'Rede Federal no Brasil',detail:'Mapa e informações oficiais dos Institutos Federais',url:'https://www.gov.br/mec/pt-br/assuntos/ept/rede-federal/institutos-federais-de-educacao-ciencia-e-tecnologia',verified:true}
    ],
    SC: [
      {institution:'IFSC',title:'Provas e gabaritos anteriores',detail:'Exames de classificação para cursos técnicos integrados e subsequentes',url:'https://www.sepei.ifsc.edu.br/web/campus-joinville/provas-e-gabaritos',verified:true},
      {institution:'MEC',title:'Rede Federal no Brasil',detail:'Mapa e informações oficiais dos Institutos Federais',url:'https://www.gov.br/mec/pt-br/assuntos/ept/rede-federal/institutos-federais-de-educacao-ciencia-e-tecnologia',verified:true}
    ]
  },
  questions: [
    {
      region:'RS', institution:'IFFar', exam:'2026', subject:'Língua Portuguesa', topic:'Pontuação',
      text:'QUESTÃO 01 – Qual pontuação substitui corretamente a figura destacada no texto?',
      options:['Ponto e vírgula.','Ponto-final.','Ponto de exclamação.','Ponto de interrogação.','Dois-pontos.'],
      answer:1, explanation:'Gabarito: B.', source:'IFFar 2026 — Língua Portuguesa.'
    },
    {
      region:'RS', institution:'IFSul', exam:'2024/1', subject:'Língua Portuguesa', topic:'Semântica e classes de palavras',
      text:'QUESTÃO – Em relação aos termos “regularmente” e “especialmente”: I. A palavra “regularmente” possui o mesmo sentido nas duas ocorrências. II. A palavra “especialmente” poderia ser substituída por “sobretudo”, sem prejuízo de sentido à frase. III. Os três termos são advérbios de intensidade.',
      options:['Apenas a afirmativa II está correta.'],
      optionLabels:['B'],
      answer:0, explanation:'Gabarito: B.', source:'IFSul 2024/1 — Língua Portuguesa.'
    },
    {
      region:'RS', institution:'IFRS', exam:'2026/1', subject:'Língua Portuguesa', topic:'Semântica',
      text:'QUESTÃO 39 – Na tirinha da Mafalda, o que o vocábulo “inquilino” designa?',
      options:['Um vizinho do prédio, em sentido denotativo.','O medo de castigo, em sentido hiperbólico.','A consciência moral, em sentido conotativo.','A mãe de Mafalda, em sentido metafórico.','A culpa da menina, em sentido metonímico.'],
      answer:2, explanation:'Gabarito: C.', source:'IFRS 2026/1 — Língua Portuguesa.'
    }
  ]
};
