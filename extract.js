const mammoth = require("mammoth");

async function run() {
  const v1 = await mammoth.extractRawText({path: "../V1_liste_Catalogue_Plateforme_ outils_IA.docx"});
  console.log("V1 length:", v1.value.length);
  require("fs").writeFileSync("v1_catalogue.txt", v1.value);

  const v2 = await mammoth.extractRawText({path: "../suite _ V1_outils digitaux_lot 2.docx"});
  console.log("V2 length:", v2.value.length);
  require("fs").writeFileSync("v2_catalogue.txt", v2.value);
}
run();
