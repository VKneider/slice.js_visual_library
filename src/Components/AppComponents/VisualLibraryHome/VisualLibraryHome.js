export default class VisualLibraryHome extends HTMLElement {
   constructor(props) {
      super();
      slice.attachTemplate(this);
      slice.controller.setComponentProps(this, props);
      this.debuggerProps = [];
   }

   async init() {
      // Crear la barra de navegación
      const navbar = await slice.build("Navbar", {
         position: "fixed",
         logo: {
            src: "/images/Slice.js-logo.png",
            path: "/",
         },
         items: [
            { text: "Home", path: "/" },
            { text: "Components", path: "/docs" },
            { text: "Documentation", path: "/docs" },
         ],
         buttons: [
            {
               value: "Change Theme",
               onClickCallback: async () => {
                  const currentTheme = slice.stylesManager.themeManager.currentTheme;
                  if (currentTheme === "Purple") {
                     await slice.setTheme("PurpleDark");
                  } else {
                     await slice.setTheme("Purple");
                  }
               },
            },
         ],
      });

      // Crear botones CTA
      const browseButton = await slice.build("Button", {
         value: "Browse Components",
         onClickCallback: () => slice.router.navigate("/docs"),
         customColor: {
            button: "var(--primary-color)",
            label: "var(--primary-color-contrast)"
         }
      });

      const docsButton = await slice.build("Button", {
         value: "View Documentation",
         onClickCallback: () => slice.router.navigate("/docs"),
         customColor: {
            button: "var(--secondary-color)",
            label: "var(--secondary-color-contrast)"
         }
      });

      this.querySelector(".cta-buttons").appendChild(browseButton);
      this.querySelector(".cta-buttons").appendChild(docsButton);

      // Crear secciones
      await this.createFeatures();
      await this.createCategories();
      await this.createShowcase();
      await this.setupQuickStart();

      // Añadir navbar al inicio
      this.insertBefore(navbar, this.firstChild);
   }

   async createFeatures() {
      const features = [
         {
            title: "🎨 Theme Integration",
            description: "All components automatically adapt to your Slice.js theme using CSS variables."
         },
         {
            title: "⚡ Performance Optimized",
            description: "Built with vanilla JavaScript and web standards for minimal overhead and fast rendering."
         },
         {
            title: "♿ Accessibility First",
            description: "WCAG compliant with proper ARIA labels, keyboard navigation, and screen reader support."
         },
         {
            title: "🔧 Fully Customizable",
            description: "Override colors, styles, and behavior through props and CSS custom properties."
         },
         {
            title: "📱 Responsive Design",
            description: "Mobile-first components that work beautifully across all device sizes."
         },
         {
            title: "🔌 Easy Integration",
            description: "Simple async API using slice.build() - just pass props and you\"re ready to go."
         }
      ];

      const featureGrid = this.querySelector(".feature-grid");

      for (const feature of features) {
         const featureElement = document.createElement("div");
         featureElement.classList.add("feature-item");

         const featureTitle = document.createElement("h3");
         featureTitle.innerHTML = feature.title;
         featureTitle.classList.add("feature-title");

         const featureDescription = document.createElement("p");
         featureDescription.textContent = feature.description;
         featureDescription.classList.add("feature-description");

         featureElement.appendChild(featureTitle);
         featureElement.appendChild(featureDescription);

         featureGrid.appendChild(featureElement);
      }
   }

   async createCategories() {
      const categories = [
         {
            name: "Input Components",
            icon: "⌨️",
            description: "Interactive form elements for user input",
            components: ["Button", "Input", "Select", "Checkbox", "Switch", "Radio"],
            path: "/docs/input"
         },
         {
            name: "Navigation",
            icon: "🧭",
            description: "Components for app navigation and routing",
            components: ["Navbar", "Sidebar", "Breadcrumb", "Tabs"],
            path: "/docs/navigation"
         },
         {
            name: "Layout",
            icon: "📐",
            description: "Structure and organize your content",
            components: ["Card", "Grid", "Container", "Divider"],
            path: "/docs/layout"
         },
         {
            name: "Display",
            icon: "📺",
            description: "Present information to users",
            components: ["Badge", "Avatar", "Icon", "Image"],
            path: "/docs/display"
         },
         {
            name: "Feedback",
            icon: "💬",
            description: "User notifications and feedback",
            components: ["Alert", "Toast", "Modal", "Tooltip"],
            path: "/docs/feedback"
         },
         {
            name: "Data Display",
            icon: "📊",
            description: "Charts, tables, and data visualization",
            components: ["Table", "List", "Progress", "Spinner"],
            path: "/docs/data"
         }
      ];

      const categoriesGrid = this.querySelector(".categories-grid");

      for (const category of categories) {
         const categoryCard = document.createElement("div");
         categoryCard.classList.add("category-card");
         categoryCard.style.cursor = "pointer";
         categoryCard.addEventListener("click", () => {
            slice.router.navigate(category.path);
         });

         const categoryIcon = document.createElement("div");
         categoryIcon.classList.add("category-icon");
         categoryIcon.textContent = category.icon;

         const categoryName = document.createElement("h3");
         categoryName.classList.add("category-name");
         categoryName.textContent = category.name;

         const categoryDescription = document.createElement("p");
         categoryDescription.classList.add("category-description");
         categoryDescription.textContent = category.description;

         const componentCount = document.createElement("div");
         componentCount.classList.add("component-count");
         componentCount.textContent = `${category.components.length} components`;

         categoryCard.appendChild(categoryIcon);
         categoryCard.appendChild(categoryName);
         categoryCard.appendChild(categoryDescription);
         categoryCard.appendChild(componentCount);

         categoriesGrid.appendChild(categoryCard);
      }
   }

   async createShowcase() {
      const showcaseContainer = this.querySelector(".showcase-container");

      // Showcase section 1: Buttons
      const buttonShowcase = document.createElement("div");
      buttonShowcase.classList.add("showcase-item");

      const buttonTitle = document.createElement("h3");
      buttonTitle.textContent = "Button Component";
      buttonShowcase.appendChild(buttonTitle);

      const buttonDescription = document.createElement("p");
      buttonDescription.textContent = "Versatile buttons with multiple styles and states";
      buttonShowcase.appendChild(buttonDescription);

      const buttonDemo = document.createElement("div");
      buttonDemo.classList.add("component-demo");

      const primaryBtn = await slice.build("Button", {
         value: "Primary Button",
         customColor: {
            button: "var(--primary-color)",
            label: "var(--primary-color-contrast)"
         }
      });

      const secondaryBtn = await slice.build("Button", {
         value: "Secondary Button",
         customColor: {
            button: "var(--secondary-color)",
            label: "var(--secondary-color-contrast)"
         }
      });

      const successBtn = await slice.build("Button", {
         value: "Success",
         customColor: {
            button: "var(--success-color)",
            label: "#ffffff"
         }
      });

      buttonDemo.appendChild(primaryBtn);
      buttonDemo.appendChild(secondaryBtn);
      buttonDemo.appendChild(successBtn);
      buttonShowcase.appendChild(buttonDemo);
      showcaseContainer.appendChild(buttonShowcase);

      // Showcase section 2: Form Inputs
      const inputShowcase = document.createElement("div");
      inputShowcase.classList.add("showcase-item");

      const inputTitle = document.createElement("h3");
      inputTitle.textContent = "Form Components";
      inputShowcase.appendChild(inputTitle);

      const inputDescription = document.createElement("p");
      inputDescription.textContent = "Complete set of form input elements";
      inputShowcase.appendChild(inputDescription);

      const inputDemo = document.createElement("div");
      inputDemo.classList.add("component-demo");

      const textInput = await slice.build("Input", {
         placeholder: "Enter your name...",
         type: "text"
      });

      const switchComponent = await slice.build("Switch", {
         label: "Enable notifications",
         checked: true
      });

      const checkboxComponent = await slice.build("Checkbox", {
         label: "I agree to terms and conditions",
         labelPlacement: "right"
      });

      inputDemo.appendChild(textInput);
      inputDemo.appendChild(switchComponent);
      inputDemo.appendChild(checkboxComponent);
      inputShowcase.appendChild(inputDemo);
      showcaseContainer.appendChild(inputShowcase);

      // Showcase section 3: Card
      const cardShowcase = document.createElement("div");
      cardShowcase.classList.add("showcase-item");

      const cardTitle = document.createElement("h3");
      cardTitle.textContent = "Card Component";
      cardShowcase.appendChild(cardTitle);

      const cardDescription = document.createElement("p");
      cardDescription.textContent = "Flexible container for content organization";
      cardShowcase.appendChild(cardDescription);

      const cardDemo = document.createElement("div");
      cardDemo.classList.add("component-demo");

      const card = await slice.build("Card", {
         title: "Example Card",
         content: "Cards are perfect for grouping related content. They support titles, content, and actions.",
      });

      const cardButton = await slice.build("Button", {
         value: "Learn More",
         customColor: {
            button: "var(--primary-color)",
            label: "var(--primary-color-contrast)"
         }
      });

      card.querySelector(".card-actions")?.appendChild(cardButton);

      cardDemo.appendChild(card);
      cardShowcase.appendChild(cardDemo);
      showcaseContainer.appendChild(cardShowcase);
   }

   async setupQuickStart() {
      const codeVisualizer = await slice.build("CodeVisualizer", {
         value: `// Install a component using Slice.js CLI
npm run slice:get Button

// Use it in your code
const button = await slice.build("Button", {
   value: "Click Me",
   onClickCallback: () => {
      console.log("Button clicked!");
   },
   customColor: {
      button: "var(--primary-color)",
      label: "var(--primary-color-contrast)"
   }
});

// Add to your component
this.appendChild(button);`,
         language: "javascript"
      });

      const codeSample = this.querySelector(".code-sample");
      codeSample.appendChild(codeVisualizer);
   }
}

customElements.define("slice-visual-library-home", VisualLibraryHome);
