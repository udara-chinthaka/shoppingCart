const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "q3s328z729ym",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "DHNun4MQq1vBXKwHsXMeD5hJurc6l7Qu9nAEn4E7elg"
});
//console.log(client);

const cartBtn = document.querySelector(".cart-btn");
const closeBtn = document.querySelector(".close-cart");
const clearBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");

const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// cart
let cart = [];
// buttons
let buttonsDOM = [];

// getting the products

class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "comfyHouseProduct"
      });
      //console.log(contentful);

      // let result = await fetch("products.json");
      // let data = await result.json();

      let products = contentful.items;
      products = products.map(item => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display products
class UI {
  displayProducts(products) {
    //console.log(products);
    let result = "";
    products.forEach(product => {
      result += `
        <!-- single eproducts -->
        <article class="product">
          <div class="img-container">
            <img
              src=${product.image}
              alt="product"
              class="product-img"
            />
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>
              add to cart
            </button>
          </div>
          <h3>${product.title}</h3>
          <h3>Rs. ${product.price}</h3>
        </article>
        <!-- end of single eproducts -->
        `;
    });
    productsDOM.innerHTML = result;
  }
  getBagButton() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);
      if (inCart) {
        button.innerText = "In cart";
        button.disabled = true;
      }
      button.addEventListener("click", event => {
        event.target.innerHTML = "In cart";
        event.target.disabled = true;
        //get product from products
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        //add product to the cart
        cart = [...cart, cartItem];
        // save cart in localstorage
        Storage.saveCart(cart);
        // set cart values
        this.setCartValues(cart);
        // display cart item
        this.addCartItem(cartItem);
        // show th cart
        this.showCart();
      });
    });
  }
  // set cart vales to css class via variables
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }
  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
    <img src=${item.image} />
            <div>
              <h4>${item.title}</h4>
              <h5>Rs.${item.price}</h5>
              <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">${item.amount}</p>
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
    `;
    console.log(div);
    cartContent.appendChild(div);
  }
  // display side cart items
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }

  setupApp() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeBtn.addEventListener("click", this.hideCart);
  }

  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }
  // remove css class to hide class
  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  } // 0717807788

  cartLogic() {
    clearBtn.addEventListener("click", () => {
      this.clearCart();
    });
    //cart functionality
    cartContent.addEventListener("click", event => {
      //if press remove button , remove item from the cart
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
        // increse items and update cart
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;

        // lower added item if item get zero remove item and update cart
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowAmount = event.target;
        let id = lowAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }

  // clear cart items
  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));
    console.log(cartContent.children);

    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
    //console.log(cartItems);
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>Add to cart `;
  }

  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }
}

// local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  // setup app
  ui.setupApp();
  const products = new Products();
  // get all products
  products
    .getProducts()
    .then(products => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButton();
      ui.cartLogic();
    });
});
