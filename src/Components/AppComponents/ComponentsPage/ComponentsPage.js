export default class ComponentsPage extends HTMLElement {
   constructor(props) {
      super();
      slice.attachTemplate(this);
      slice.controller.setComponentProps(this, props);
      this.debuggerProps = [];
   }

   async init() {
      await this.createQuickLinks();
      await this.createCategoriesOverview();
      await this.createGettingStartedSteps();
      await this.createFeatures();
   }

   async createQuickLinks() {
      const quickLinksContainer = this.querySelector('.quick-links');

      const browseButton = await slice.build('Button', {
         value: '📚 Browse All Components',
         onClickCallback: () => slice.router.navigate('/components/input'),
         customColor: {
            button: 'var(--primary-color)',
            label: 'var(--primary-color-contrast)'
         }
      });

      const searchButton = await slice.build('Button', {
         value: '🔍 Search Components',
         onClickCallback: () => {
            // Implementar búsqueda en el futuro
            alert('Search functionality coming soon!');
         },
         customColor: {
            button: 'var(--secondary-color)',
            label: 'var(--secondary-color-contrast)'
         }
      });

      quickLinksContainer.appendChild(browseButton);
      quickLinksContainer.appendChild(searchButton);
   }

   async createCategoriesOverview() {
      const categories = [
         {
            name: 'Input Components',
            icon: '⌨️',
            count: 5,
            description: 'Interactive form elements for user input',
            path: '/components/input',
            components: ['Button', 'Input', 'Select', 'Checkbox', 'Switch']
         },
         {
            name: 'Navigation',
            icon: '🧭',
            count: 2,
            description: 'Components for app navigation',
            path: '/components/navigation',
            components: ['Navbar', 'TreeView']
         },
         {
            name: 'Layout',
            icon: '📐',
            count: 4,
            description: 'Structure and organize content',
            path: '/components/layout',
            components: ['Card', 'Grid', 'Layout', 'Details']
         },
         {
            name: 'Display',
            icon: '📺',
            count: 2,
            description: 'Present information to users',
            path: '/components/display',
            components: ['Loading', 'CodeVisualizer']
         },
         {
            name: 'Routing',
            icon: '🛣️',
            count: 2,
            description: 'Client-side routing components',
            path: '/components/routing',
            components: ['Route', 'MultiRoute']
         }
      ];

      const categoriesContainer = this.querySelector('.categories-overview');

      for (const category of categories) {
         const categoryCard = document.createElement('div');
         categoryCard.classList.add('category-overview-card');
         categoryCard.style.cursor = 'pointer';
         categoryCard.addEventListener('click', () => {
            slice.router.navigate(category.path);
         });

         const categoryHeader = document.createElement('div');
         categoryHeader.classList.add('category-header');

         const categoryIcon = document.createElement('span');
         categoryIcon.classList.add('category-icon');
         categoryIcon.textContent = category.icon;

         const categoryName = document.createElement('h3');
         categoryName.textContent = category.name;

         const categoryCount = document.createElement('span');
         categoryCount.classList.add('category-count');
         categoryCount.textContent = `${category.count} components`;

         categoryHeader.appendChild(categoryIcon);
         categoryHeader.appendChild(categoryName);
         categoryHeader.appendChild(categoryCount);

         const categoryDescription = document.createElement('p');
         categoryDescription.classList.add('category-description');
         categoryDescription.textContent = category.description;

         const componentsList = document.createElement('div');
         componentsList.classList.add('components-list');
         category.components.forEach(comp => {
            const componentTag = document.createElement('span');
            componentTag.classList.add('component-tag');
            componentTag.textContent = comp;
            componentsList.appendChild(componentTag);
         });

         categoryCard.appendChild(categoryHeader);
         categoryCard.appendChild(categoryDescription);
         categoryCard.appendChild(componentsList);

         categoriesContainer.appendChild(categoryCard);
      }
   }

   async createGettingStartedSteps() {
      const steps = [
         {
            code: `npm run slice:get Button`,
            language: 'bash'
         },
         {
            code: `const button = await slice.build('Button', {
   value: 'Click Me',
   onClickCallback: () => {
      console.log('Clicked!');
   }
});

this.appendChild(button);`,
            language: 'javascript'
         },
         {
            code: `const button = await slice.build('Button', {
   value: 'Custom Button',
   customColor: {
      button: 'var(--success-color)',
      label: '#ffffff'
   }
});`,
            language: 'javascript'
         }
      ];

      const stepCards = this.querySelectorAll('.step-card .code-example');
      
      for (let i = 0; i < steps.length && i < stepCards.length; i++) {
         const codeVisualizer = await slice.build('CodeVisualizer', {
            value: steps[i].code,
            language: steps[i].language
         });
         stepCards[i].appendChild(codeVisualizer);
      }
   }

   async createFeatures() {
      const features = [
         {
            icon: '🎨',
            title: 'Theme Integration',
            description: 'All components automatically adapt to your Slice.js theme using CSS variables'
         },
         {
            icon: '⚡',
            title: 'Performance',
            description: 'Built with vanilla JavaScript and optimized for minimal overhead'
         },
         {
            icon: '♿',
            title: 'Accessible',
            description: 'WCAG compliant with proper ARIA labels and keyboard navigation'
         },
         {
            icon: '🔧',
            title: 'Customizable',
            description: 'Override colors, styles, and behavior through props and CSS'
         },
         {
            icon: '📱',
            title: 'Responsive',
            description: 'Mobile-first design that works on all device sizes'
         },
         {
            icon: '📦',
            title: 'Easy Install',
            description: 'Simple CLI commands to add components to your project'
         }
      ];

      const featuresGrid = this.querySelector('.features-grid');

      for (const feature of features) {
         const featureCard = document.createElement('div');
         featureCard.classList.add('feature-card');

         const featureIcon = document.createElement('div');
         featureIcon.classList.add('feature-icon');
         featureIcon.textContent = feature.icon;

         const featureTitle = document.createElement('h3');
         featureTitle.textContent = feature.title;

         const featureDescription = document.createElement('p');
         featureDescription.textContent = feature.description;

         featureCard.appendChild(featureIcon);
         featureCard.appendChild(featureTitle);
         featureCard.appendChild(featureDescription);

         featuresGrid.appendChild(featureCard);
      }
   }
}

customElements.define('slice-visual-components-home', ComponentsPage);