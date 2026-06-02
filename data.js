// ManutenPão — dados de exemplo (seed). Persistido em localStorage após o 1º carregamento.
window.SEED = {
  technicians: ["Carlos Andrade", "Marina Lopes", "Rafael Souza", "Juliana Reis"],
  clients: [
    { id:"CLI-01", name:"Padaria Pão Quente", city:"São Paulo / SP" },
    { id:"CLI-02", name:"Rede Trigo Dourado", city:"Campinas / SP" },
    { id:"CLI-03", name:"Padaria Vila Nova", city:"Santos / SP" },
    { id:"CLI-04", name:"Confeitaria Doce Forno", city:"Guarulhos / SP" },
    { id:"CLI-05", name:"Padaria Bom Pão", city:"Osasco / SP" },
    { id:"CLI-06", name:"Empório do Trigo", city:"São Bernardo / SP" }
  ],
  equipments: [
    { id:"EQ-0001", model:"Forno Turbo 8 Esteiras TX-800", type:"Forno", status:"Alocado", client:"Padaria Pão Quente", city:"São Paulo / SP", notes:"Comodato 24 meses." },
    { id:"EQ-0002", model:"Câmara Fria Modular 6m³", type:"Câmara fria", status:"Alocado", client:"Rede Trigo Dourado", city:"Campinas / SP", notes:"" },
    { id:"EQ-0003", model:"Modeladora de Pães MP-200", type:"Modeladora", status:"Manutenção", client:"Padaria Vila Nova", city:"Santos / SP", notes:"Correia em substituição." },
    { id:"EQ-0004", model:"Fermentadora Controlada FC-40", type:"Fermentadora", status:"Disponível", client:"", city:"Centro de Distribuição / SP", notes:"Revisada e pronta." },
    { id:"EQ-0005", model:"Divisora Hidráulica DH-30", type:"Divisora", status:"Alocado", client:"Confeitaria Doce Forno", city:"Guarulhos / SP", notes:"" },
    { id:"EQ-0006", model:"Forno Lastro Elétrico FL-4", type:"Forno", status:"Disponível", client:"", city:"Centro de Distribuição / SP", notes:"" },
    { id:"EQ-0007", model:"Câmara de Congelamento Rápido CR-10", type:"Câmara fria", status:"Manutenção", client:"Padaria Bom Pão", city:"Osasco / SP", notes:"Compressor em análise." },
    { id:"EQ-0008", model:"Modeladora MP-200 Plus", type:"Modeladora", status:"Alocado", client:"Empório do Trigo", city:"São Bernardo / SP", notes:"" }
  ],
  orders: [
    { id:"OS-1042", clientId:"CLI-03", equip:"EQ-0003", priority:"Alta", tech:"Carlos Andrade", status:"Em andamento", desc:"Correia da modeladora rompida, esteira não avança.", opened:"2026-05-28", resolution:"", startedBy:"Carlos Andrade", startedAt:"2026-05-29", events:[
      { when:"2026-05-28", desc:"OS aberta", by:"Gestão" },
      { when:"2026-05-28", desc:"Distribuída ao mecânico Carlos Andrade", by:"Gestão" },
      { when:"2026-05-29", desc:"Status alterado: Aberta → Em andamento", by:"Carlos Andrade" }
    ] },
    { id:"OS-1043", clientId:"CLI-05", equip:"EQ-0007", priority:"Crítica", tech:"Marina Lopes", status:"Aberta", desc:"Câmara não atinge temperatura de congelamento.", opened:"2026-05-30", resolution:"", events:[] },
    { id:"OS-1041", clientId:"CLI-01", equip:"EQ-0001", priority:"Média", tech:"Rafael Souza", status:"Concluída", desc:"Calibração de temperatura do forno.", opened:"2026-05-20", resolution:"Termostato recalibrado e testado. Equipamento liberado.", closedBy:"Rafael Souza", closedAt:"2026-05-22", events:[
      { when:"2026-05-20", desc:"OS aberta", by:"Gestão" },
      { when:"2026-05-20", desc:"Distribuída ao mecânico Rafael Souza", by:"Gestão" },
      { when:"2026-05-22", desc:"Baixa técnica registrada.", by:"Rafael Souza" },
      { when:"2026-05-22", desc:"Status alterado: Em andamento → Concluída", by:"Rafael Souza" }
    ] },
    { id:"OS-1040", clientId:"CLI-04", equip:"EQ-0005", priority:"Baixa", tech:"Juliana Reis", status:"Concluída", desc:"Ruído no sistema hidráulico da divisora.", opened:"2026-05-18", resolution:"Substituição de vedação e reposição de óleo.", closedBy:"Juliana Reis", closedAt:"2026-05-19", events:[
      { when:"2026-05-18", desc:"OS aberta", by:"Gestão" },
      { when:"2026-05-18", desc:"Distribuída ao mecânico Juliana Reis", by:"Gestão" },
      { when:"2026-05-19", desc:"Baixa técnica registrada.", by:"Juliana Reis" },
      { when:"2026-05-19", desc:"Status alterado: Em andamento → Concluída", by:"Juliana Reis" }
    ] },
    { id:"OS-1044", clientId:"CLI-02", equip:"EQ-0002", priority:"Média", tech:"", status:"Aberta", desc:"Porta da câmara fria com vedação danificada.", opened:"2026-06-01", resolution:"", events:[] }
  ]
};
