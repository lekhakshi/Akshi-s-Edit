const SUPABASE_URL = "https://zqkvlvnlqqvvuzzrztih.supabase.co";
const SUPABASE_KEY = "sb_publishable_kYBnwd8_WUjVjp-tGKiafA_K11tG_an";

const BUCKET = "Product-images";
const TABLE = "Products";


/* =========================
   SUPABASE HEADERS
========================= */

const apiHeaders = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY
};


/* =========================
   ADD PRODUCT + IMAGES
========================= */

const form = document.getElementById("productForm");
const imageInput = document.getElementById("images");
const preview = document.getElementById("preview");

let selectedImages = [];


/* SHOW IMAGE PREVIEWS */

if (imageInput) {
  imageInput.addEventListener("change", function () {
    selectedImages = Array.from(imageInput.files);
    preview.innerHTML = "";

    selectedImages.forEach(function (file) {
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.alt = "Product preview";
      preview.appendChild(image);
    });
  });
}


/* =========================
   UPLOAD ONE IMAGE
========================= */

async function uploadImage(file) {

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");

  const fileName =
    "products/" +
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2, 10) +
    "-" +
    safeName;

  const uploadUrl =
    SUPABASE_URL +
    "/storage/v1/object/" +
    BUCKET +
    "/" +
    fileName;

  const response = await fetch(uploadUrl, {
    method: "POST",

    headers: {
      ...apiHeaders,
      "Content-Type": file.type
    },

    body: file
  });


  if (!response.ok) {
    const error = await response.text();
    throw new Error("Image upload failed: " + error);
  }


  return (
    SUPABASE_URL +
    "/storage/v1/object/public/" +
    BUCKET +
    "/" +
    fileName
  );
}


/* =========================
   PUBLISH PRODUCT
========================= */

if (form) {

  form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const message = document.getElementById("message");
    const button =
      form.querySelector("button[type='submit']");


    try {

      if (!selectedImages.length) {
        throw new Error("Please select at least one image.");
      }


      message.textContent = "Uploading images...";
      button.disabled = true;


      /* Upload all images */

      const imageUrls = [];

      for (const file of selectedImages) {
        const imageUrl = await uploadImage(file);
        imageUrls.push(imageUrl);
      }


      message.textContent = "Publishing product...";


      /* Create product */

      const product = {
        name: document.getElementById("name").value.trim(),

        price: Number(
          document.getElementById("price").value
        ),

        category:
          document.getElementById("category").value.trim(),

        sizes:
          document.getElementById("sizes").value.trim(),

        description:
          document.getElementById("description").value.trim(),

        images: JSON.stringify(imageUrls)
      };


      const response = await fetch(
        SUPABASE_URL + "/rest/v1/" + TABLE,
        {
          method: "POST",

          headers: {
            ...apiHeaders,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },

          body: JSON.stringify(product)
        }
      );


      if (!response.ok) {
        const error = await response.text();
        throw new Error("Product save failed: " + error);
      }


      message.textContent =
        "Product published successfully!";


      form.reset();
      preview.innerHTML = "";
      selectedImages = [];


      setTimeout(function () {
        window.location.href = "index.html";
      }, 1200);


    } catch (error) {

      console.error(error);

      message.textContent =
        error.message || "Could not publish product.";

      button.disabled = false;
    }

  });

}


/* =========================
   GET ALL PRODUCTS
========================= */

async function getProducts() {

  const response = await fetch(
    SUPABASE_URL +
    "/rest/v1/" +
    TABLE +
    "?select=*&order=created_at.desc",
    {
      headers: apiHeaders
    }
  );


  if (!response.ok) {
    throw new Error(await response.text());
  }


  return await response.json();
}


/* =========================
   LOAD PRODUCTS ON HOMEPAGE
========================= */

const productsContainer =
  document.getElementById("productsContainer");


if (productsContainer) {

  productsContainer.innerHTML =
    "<p>Loading products...</p>";


  getProducts()

    .then(function (products) {

      if (!products.length) {

        productsContainer.innerHTML =
          "<p class='empty-products'>No products yet.</p>";

        return;
      }


      productsContainer.innerHTML = "";


      products.forEach(function (product) {

        let images = [];


        try {
          images =
            typeof product.images === "string"
              ? JSON.parse(product.images || "[]")
              : product.images || [];

        } catch (error) {
          images = [];
        }


        const image = images[0] || "";


        const card =
          document.createElement("article");

        card.className = "product-card";


        card.innerHTML = `
          <a href="product.html?id=${product.id}">

            <div class="product-image">

              ${
                image
                  ? `<img src="${image}" alt="${product.name}">`
                  : `<span>AKSHI'S EDIT</span>`
              }

            </div>

            <div class="product-info">

              <p>${product.category || ""}</p>

              <h3>${product.name || ""}</h3>

              <strong>
                ₹${Number(
                  product.price || 0
                ).toLocaleString("en-IN")}
              </strong>

            </div>

          </a>
        `;


        productsContainer.appendChild(card);

      });

    })


    .catch(function (error) {

      console.error(error);

      productsContainer.innerHTML =
        "<p>Could not load products.</p>";

    });

}


/* =========================
   LOAD SINGLE PRODUCT PAGE
========================= */

const productPage =
  document.getElementById("productPage");


if (productPage) {

  const params =
    new URLSearchParams(window.location.search);

  const productId = params.get("id");


  if (!productId) {

    productPage.innerHTML =
      "<h2>Product not found.</h2>";

  } else {

    productPage.innerHTML =
      "<p>Loading product...</p>";


    fetch(
      SUPABASE_URL +
      "/rest/v1/" +
      TABLE +
      "?id=eq." +
      encodeURIComponent(productId) +
      "&select=*",
      {
        headers: apiHeaders
      }
    )

      .then(function (response) {

        if (!response.ok) {
          throw new Error(
            "Could not load product"
          );
        }

        return response.json();

      })


      .then(function (products) {

        if (!products.length) {

          productPage.innerHTML =
            "<h2>Product not found.</h2>";

          return;
        }


        const product = products[0];

        let images = [];


        try {

          images =
            typeof product.images === "string"
              ? JSON.parse(product.images || "[]")
              : product.images || [];

        } catch (error) {
          images = [];
        }


        productPage.innerHTML = `

          <div class="single-product">

            <div class="single-images">

              ${
                images.length

                  ? images.map(function (image) {
                      return `
                        <img
                          src="${image}"
                          alt="${product.name}"
                        >
                      `;
                    }).join("")

                  : `
                    <div class="no-image">
                      AKSHI'S EDIT
                    </div>
                  `
              }

            </div>


            <div class="single-info">

              <p>
                ${product.category || ""}
              </p>

              <h1>
                ${product.name || ""}
              </h1>

              <h2>
                ₹${Number(
                  product.price || 0
                ).toLocaleString("en-IN")}
              </h2>


              <p class="sizes">

                <strong>Sizes:</strong>

                ${
                  product.sizes ||
                  "Not specified"
                }

              </p>


              <p class="description">

                ${
                  product.description || ""
                }

              </p>


              <button class="add-btn">
                ADD TO BAG
              </button>

            </div>

          </div>

        `;

      })


      .catch(function (error) {

        console.error(error);

        productPage.innerHTML =
          "<p>Could not load this product.</p>";

      });

  }

}
