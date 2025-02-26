const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

// Chemin vers le fichier db.json
const dataPath = path.join(__dirname, "data", "db.json");

// Ajout d'un middleware de validation
const validateProduct = (req, res, next) => {
  const { price, quantity } = req.body;

  // Vérifier si price et quantity existent et sont bien des nombres
  if (price === undefined || price === "" || isNaN(Number(price))) {
    return res.status(400).json({
      message: "Le prix est obligatoire et doit être un nombre valide.",
    });
  }

  if (quantity === undefined || quantity === "" || isNaN(Number(quantity))) {
    return res.status(400).json({
      message: "La quantité est obligatoire et doit être un nombre valide.",
    });
  }

  // Vérifier que price et quantity ne sont pas négatifs
  if (+price < 0) {
    return res.status(400).json({
      message: "Le prix ne peut pas être négatif.",
    });
  }

  if (+quantity < 0) {
    return res.status(400).json({
      message: "La quantité ne peut pas être négative.",
    });
  }

  next();
};

// Middleware pour parser le JSON
app.use(express.json());

// route
app.get("/", (req, res) => {
  res.send("hello world");
});

// Helper pour lire les données du fichier JSON
const readProducts = () => {
  const data = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(data);
};

// Helper pour écrire les données dans le fichier JSON
const createProduct = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
};

// Route pour récupérer tous les éléments (READ)
app.get("/products", (req, res) => {
  const products = readProducts();
  res.status(200).json(products);
});

// Route pour récupérer un élément par son ID (READ)
app.get("/products/:id", (req, res) => {
  const products = readProducts();
  const currentProductID = +req.params.id;
  const product = products.find((product) => product.id === currentProductID);

  if (!product) {
    return res.status(404).json({ message: "Produit non trouvé" });
  }

  res.status(200).json(product);
});

// Route pour créer un nouvel élément (CREATE)
app.post("/products", validateProduct, (req, res) => {
  const products = readProducts();
  const { name, price, quantity } = req.body;

  if (!name || !price || !quantity) {
    return res.status(400).json({
      message: "Le nom, le prix, et la quantité sont des champs obligatoires",
    });
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price: +price,
    quantity: +quantity,
  };

  products.push(newProduct);
  createProduct(products);

  res.status(201).json({
    message: "Le produit a bien été ajouté au stock",
    data: newProduct,
  });
});

// Route pour mettre à jour un élément (UPDATE)
app.put("/products/:id", validateProduct, (req, res) => {
  const products = readProducts();
  const { name, price, quantity } = req.body;
  const currentProductID = +req.params.id;
  const productIndex = products.findIndex(
    (product) => product.id === currentProductID
  );

  if (productIndex === -1) {
    return res.status(404).json({ message: "Produit non trouvé" });
  }

  const updatedProduct = { ...products[productIndex] };

  if (name !== undefined && name.trim() !== "") {
    updatedProduct.name = name;
  }

  if (price !== undefined) {
    if (isNaN(Number(price)) || Number(price) < 0) {
      return res
        .status(400)
        .json({ message: "Le prix doit être un nombre valide et positif." });
    }
    updatedProduct.price = Number(price);
  }

  if (quantity !== undefined) {
    if (isNaN(Number(quantity)) || Number(quantity) < 0) {
      return res.status(400).json({
        message: "La quantité doit être un nombre valide et positive.",
      });
    }
    updatedProduct.quantity = Number(quantity);
  }

  products[productIndex] = updatedProduct;
  createProduct(products);

  res.status(200).json({
    message: "Produit mis à jour avec succès.",
    data: updatedProduct,
  });
});

// Route pour supprimer un élément (DELETE)
app.delete("/products/:id", (req, res) => {
  const products = readProducts();
  const currentProductID = +req.params.id;
  const productIndex = products.findIndex(
    (item) => item.id === currentProductID
  );

  if (productIndex === -1) {
    return res.status(404).json({ message: "Produit non trouvé" });
  }

  products.splice(productIndex, 1);
  createProduct(products);

  res.status(204).send();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Une erreur a étè detecté, veuillez patientez s'il vous plait",
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});