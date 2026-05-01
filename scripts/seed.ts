import "dotenv/config";
import bcrypt from "bcrypt";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, posts } from "../db/schema";
import * as schema from "../db/schema";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or TEST_DATABASE_URL is required for seeding.");
}

const sql = neon(databaseUrl);

const db = drizzle(sql, { schema });

const samplePosts = [
  // Steve's posts (15 posts)
  {
    title: "Getting Started with Next.js 14",
    content:
      "<h2>Introduction</h2><p>Next.js 14 brings exciting new features and improvements to the React framework ecosystem. In this comprehensive guide, we'll explore the key features and how to get started with your first Next.js 14 project.</p><h3>What's New in Next.js 14</h3><p>The latest version includes improvements in server components, edge functions, and performance optimizations. The App Router is now fully stable and production-ready, making it the recommended approach for new projects.</p><h3>Installation and Setup</h3><p>Getting started is as simple as running <code>npx create-next-app@latest</code> and following the interactive prompts. This will scaffold a modern Next.js project with all the necessary configurations.</p><p>Key benefits include built-in TypeScript support, CSS modules, and automatic code splitting. The framework continues to evolve with developer experience at its core.</p>",
    tags: ["Next.js", "React", "Web Development", "JavaScript"],
  },
  {
    title: "Mastering TypeScript Generics",
    content:
      "<h2>Understanding Generics</h2><p>TypeScript generics allow you to write reusable, flexible code that works with multiple types while maintaining type safety. This is one of the most powerful features of TypeScript.</p><h3>Generic Functions</h3><p>A generic function can accept parameters of various types and return values of those same types. This eliminates the need for function overloading or using the <code>any</code> type.</p><pre><code>function identity&lt;T&gt;(arg: T): T {\n  return arg;\n}</code></pre><h3>Generic Constraints</h3><p>You can constrain what types can be used with a generic by extending specific types. This ensures that the generic works only with types that have certain properties or methods.</p><h3>Real-world Applications</h3><p>Generics are particularly useful when building libraries, creating reusable API clients, or working with data structures like arrays, promises, and custom collections.</p>",
    tags: ["TypeScript", "Programming", "Best Practices"],
  },
  {
    title: "Building Scalable Node.js Applications",
    content:
      "<h2>Scalability Fundamentals</h2><p>Building scalable Node.js applications requires understanding both architectural patterns and practical optimization techniques. Let's explore the key principles.</p><h3>Horizontal vs Vertical Scaling</h3><p>Horizontal scaling involves adding more server instances behind a load balancer, while vertical scaling means increasing resources on existing servers. Most production applications use a combination of both approaches.</p><h3>Clustering and Load Balancing</h3><p>Node.js includes built-in clustering support for utilizing multi-core processors. Combined with external load balancers like nginx, you can distribute traffic efficiently across multiple instances.</p><h3>Caching Strategies</h3><p>Implement multi-level caching using Redis for session data, application-level caches for frequently accessed data, and HTTP caching for client-side optimization. This significantly reduces database load.</p>",
    tags: ["Node.js", "Scalability", "Backend", "Performance"],
  },
  {
    title: "Database Optimization Techniques",
    content:
      "<h2>Query Optimization</h2><p>The most impactful performance improvements often come from optimizing database queries. Proper indexing, query analysis, and efficient data retrieval patterns are essential.</p><h3>Indexing Strategy</h3><p>Create indexes on columns frequently used in WHERE clauses and JOIN conditions. However, be cautious about over-indexing as it impacts write performance and storage space.</p><h3>Connection Pooling</h3><p>Use connection pooling to reuse database connections instead of creating new ones for each request. This dramatically reduces overhead and improves throughput.</p><h3>Query Analysis Tools</h3><p>Use EXPLAIN plans to understand query execution. Identify sequential scans that could benefit from indexes, and look for opportunities to denormalize data when appropriate.</p>",
    tags: ["Database", "SQL", "Performance Optimization"],
  },
  {
    title: "REST API Design Best Practices",
    content:
      "<h2>Building RESTful APIs</h2><p>A well-designed REST API is intuitive, maintainable, and scalable. These best practices help create APIs that developers love to use.</p><h3>HTTP Methods and Status Codes</h3><p>Use HTTP methods correctly: GET for retrieval, POST for creation, PUT/PATCH for updates, and DELETE for removal. Return appropriate status codes that accurately reflect the operation outcome.</p><h3>Resource-Oriented Design</h3><p>Design your endpoints around resources, not actions. For example, use <code>/api/posts/123/comments</code> instead of <code>/api/posts/123/getComments</code>.</p><h3>Versioning and Backward Compatibility</h3><p>Plan for API evolution. Implement versioning strategies that allow you to introduce breaking changes without disrupting existing clients.</p>",
    tags: ["API Design", "REST", "Backend Development"],
  },
  {
    title: "React Hooks Deep Dive",
    content:
      "<h2>Understanding React Hooks</h2><p>React Hooks revolutionized how we write components by allowing state and side effects in functional components. Understanding their nuances is crucial for modern React development.</p><h3>Rules of Hooks</h3><p>Hooks must be called at the top level of functional components or custom hooks. They cannot be called conditionally or in loops. This ensures consistent ordering between re-renders.</p><h3>Custom Hooks</h3><p>Extract component logic into custom hooks for reusability. A well-designed custom hook encapsulates specific functionality and can be shared across multiple components.</p><h3>useEffect Cleanup</h3><p>Always return a cleanup function from useEffect when necessary. This prevents memory leaks and ensures resources are properly released when components unmount.</p>",
    tags: ["React", "JavaScript", "Frontend"],
  },
  {
    title: "CSS Grid vs Flexbox",
    content:
      "<h2>Layout Techniques</h2><p>Modern CSS provides powerful layout tools. Understanding when to use Grid versus Flexbox ensures efficient, maintainable stylesheets.</p><h3>Flexbox for One-Dimensional Layouts</h3><p>Use Flexbox when arranging items in a single dimension (row or column). It excels at aligning and distributing space between items with minimal code.</p><h3>CSS Grid for Two-Dimensional Layouts</h3><p>Grid is perfect for page layouts and complex, multi-dimensional designs. Define both rows and columns for precise control over element placement.</p><h3>Practical Examples</h3><p>Navigation bars work well with Flexbox. Dashboard layouts benefit from Grid. Many designs combine both techniques for optimal results.</p>",
    tags: ["CSS", "Frontend", "Web Design"],
  },
  {
    title: "Microservices Architecture",
    content:
      "<h2>Breaking Down Monoliths</h2><p>Microservices architecture breaks applications into smaller, independent services. This approach offers scalability and flexibility but introduces complexity.</p><h3>Service Communication</h3><p>Services communicate via REST APIs, message queues, or gRPC. Choose communication patterns based on consistency requirements and latency constraints.</p><h3>Data Management</h3><p>Each microservice typically owns its data. This independence prevents tight coupling but requires careful handling of distributed transactions.</p><h3>Challenges and Solutions</h3><p>Network latency, distributed debugging, and operational complexity are key challenges. Container orchestration platforms like Kubernetes help manage these complexities.</p>",
    tags: ["Architecture", "Microservices", "Backend", "DevOps"],
  },
  {
    title: "Testing Strategies for Applications",
    content:
      "<h2>The Testing Pyramid</h2><p>A well-balanced testing strategy includes unit tests at the base, integration tests in the middle, and end-to-end tests at the top. Each layer serves a specific purpose.</p><h3>Unit Testing</h3><p>Test individual functions and components in isolation. Use mocking to eliminate external dependencies. Unit tests should be fast and numerous.</p><h3>Integration Testing</h3><p>Test how components work together. Verify database interactions, API calls, and complex workflows. These tests catch issues that unit tests miss.</p><h3>End-to-End Testing</h3><p>Simulate user interactions with the complete application. These tests are slower but provide confidence that the system works as intended.</p>",
    tags: ["Testing", "Quality Assurance", "Development"],
  },
  {
    title: "Security Best Practices for Web Applications",
    content:
      "<h2>Protecting Your Application</h2><p>Security must be a priority from the beginning. Implement these practices to protect your application and users from common attacks.</p><h3>Authentication and Authorization</h3><p>Use established authentication standards like OAuth 2.0. Implement proper authorization checks to ensure users can only access resources they're permitted to see.</p><h3>HTTPS and TLS</h3><p>Always use HTTPS in production. This encrypts data in transit and protects against man-in-the-middle attacks.</p><h3>Input Validation</h3><p>Never trust user input. Validate and sanitize all data on both client and server side. Use parameterized queries to prevent SQL injection.</p><h3>Dependency Management</h3><p>Keep dependencies updated and monitor for security vulnerabilities. Use tools like npm audit to identify and fix vulnerable packages.</p>",
    tags: ["Security", "Web Development", "Best Practices"],
  },
  {
    title: "Performance Monitoring and Logging",
    content:
      "<h2>Observability Matters</h2><p>Effective monitoring and logging are essential for maintaining healthy production systems. They help identify issues quickly and understand application behavior.</p><h3>Structured Logging</h3><p>Use structured logging with consistent formats. Include context like request IDs and user information. This makes logs easier to search and analyze.</p><h3>Metrics Collection</h3><p>Collect key metrics: response times, error rates, database query performance. Use these metrics to identify bottlenecks and optimize performance.</p><h3>Distributed Tracing</h3><p>In microservices environments, trace requests across service boundaries. This helps understand request flow and identify where delays occur.</p>",
    tags: ["DevOps", "Monitoring", "Performance"],
  },
  {
    title: "Modern State Management",
    content:
      "<h2>Choosing the Right Approach</h2><p>State management is crucial for building maintainable applications. Different tools serve different needs.</p><h3>Redux for Complex State</h3><p>Redux provides predictable state management with time-travel debugging. It's ideal for applications with complex, interconnected state.</p><h3>Context API for Simpler Needs</h3><p>React's Context API is sufficient for many applications. It avoids the overhead of Redux for simpler state requirements.</p><h3>Emerging Alternatives</h3><p>Tools like Zustand and Jotai offer lightweight alternatives to Redux. Consider your project's complexity when choosing a state management solution.</p>",
    tags: ["State Management", "React", "Frontend Architecture"],
  },
  {
    title: "Docker and Containerization",
    content:
      "<h2>Container Basics</h2><p>Docker containers provide consistent environments from development through production. Understanding containerization is essential for modern DevOps.</p><h3>Creating Dockerfiles</h3><p>Write efficient Dockerfiles with small base images and minimal layers. Use multi-stage builds to reduce final image size.</p><h3>Docker Compose for Development</h3><p>Use Docker Compose to orchestrate multiple containers locally. Define your entire development environment in a single file.</p><h3>Registry and Deployment</h3><p>Store images in registries like Docker Hub or private registries. Deploy containers to orchestration platforms like Kubernetes or Docker Swarm.</p>",
    tags: ["Docker", "DevOps", "Containerization"],
  },
  {
    title: "Async/Await in JavaScript",
    content:
      "<h2>Handling Asynchronous Code</h2><p>Async/await syntax makes asynchronous code easier to read and maintain. It's built on top of Promises and provides a synchronous-looking syntax.</p><h3>Basic Usage</h3><p>Mark functions with <code>async</code> to enable the use of <code>await</code> inside them. Await pauses execution until a Promise resolves, making control flow clearer.</p><h3>Error Handling</h3><p>Use try-catch blocks with async/await for clean error handling. This is often more readable than .catch() on Promises.</p><h3>Parallel Operations</h3><p>Use Promise.all() to run multiple async operations in parallel. This is more efficient than awaiting each operation sequentially.</p>",
    tags: ["JavaScript", "Async Programming", "Best Practices"],
  },
  {
    title: "Version Control with Git",
    content:
      "<h2>Git Fundamentals</h2><p>Git is the industry standard for version control. Mastering Git workflows improves collaboration and code quality.</p><h3>Branching Strategies</h3><p>Use feature branches for development and keep the main branch stable. Implement strategies like Git Flow or trunk-based development based on your team's needs.</p><h3>Commit Messages</h3><p>Write clear, descriptive commit messages that explain the 'why' behind changes. Good commit history makes code review and debugging easier.</p><h3>Collaboration with Pull Requests</h3><p>Use pull requests for code review before merging to main. This ensures code quality and knowledge sharing among team members.</p>",
    tags: ["Git", "DevOps", "Collaboration"],
  },

  // Maria's posts (15 posts)
  {
    title: "Introduction to Machine Learning",
    content:
      "<h2>Getting Started with ML</h2><p>Machine Learning is transforming industries by enabling computers to learn from data and make predictions. This guide introduces fundamental ML concepts.</p><h3>Supervised vs Unsupervised Learning</h3><p>Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data. Choose the approach based on your problem.</p><h3>Key ML Algorithms</h3><p>Linear regression, decision trees, and neural networks are foundational algorithms. Each serves different purposes and has distinct strengths.</p><h3>Getting Started</h3><p>Start with Python and libraries like scikit-learn. Work through datasets on Kaggle to practice and build your portfolio.</p>",
    tags: ["Machine Learning", "AI", "Data Science"],
  },
  {
    title: "Data Visualization with D3.js",
    content:
      "<h2>Creating Interactive Visualizations</h2><p>D3.js is a powerful library for creating custom, interactive data visualizations. Learn to transform raw data into compelling visual stories.</p><h3>D3 Fundamentals</h3><p>Understand selection, data binding, and transitions. These core concepts form the foundation of all D3 visualizations.</p><h3>Building Charts</h3><p>Create bar charts, line graphs, scatter plots, and more. D3 provides the flexibility to build any visualization you can imagine.</p><h3>Best Practices</h3><p>Keep visualizations clear and intuitive. Use color effectively, provide proper labeling, and ensure accessibility for all users.</p>",
    tags: ["Data Visualization", "D3.js", "Frontend"],
  },
  {
    title: "Python for Data Analysis",
    content:
      "<h2>Pandas and NumPy Essentials</h2><p>Python has become the go-to language for data analysis. Libraries like Pandas and NumPy make working with data efficient and enjoyable.</p><h3>NumPy for Numerical Computing</h3><p>NumPy provides efficient multi-dimensional arrays and vectorized operations. It's the foundation for most numerical Python packages.</p><h3>Pandas for Data Manipulation</h3><p>Pandas DataFrames make it easy to load, clean, and analyze data. Handle missing values, group data, and create pivot tables with simple operations.</p><h3>Data Cleaning</h3><p>Data quality is crucial for analysis. Spend time removing duplicates, handling missing values, and validating data types before analysis.</p>",
    tags: ["Python", "Data Analysis", "Pandas"],
  },
  {
    title: "Web Accessibility Standards",
    content:
      "<h2>Building Inclusive Web Applications</h2><p>Accessibility ensures your web application is usable by everyone, including people with disabilities. It's both an ethical imperative and a legal requirement.</p><h3>WCAG Guidelines</h3><p>Follow Web Content Accessibility Guidelines. Use semantic HTML, provide alt text for images, and ensure keyboard navigation works throughout your site.</p><h3>Color and Contrast</h3><p>Maintain sufficient color contrast for readability. Don't rely solely on color to convey information, as many users are colorblind.</p><h3>Testing for Accessibility</h3><p>Use accessibility testing tools and involve people with disabilities in user testing. Automated tools catch some issues, but manual testing is essential.</p>",
    tags: ["Accessibility", "Web Standards", "UX"],
  },
  {
    title: "Responsive Design Principles",
    content:
      "<h2>Mobile-First Approach</h2><p>Responsive design ensures your website works beautifully on all device sizes. Start with mobile and enhance for larger screens.</p><h3>Flexible Layouts</h3><p>Use relative units like percentages and em instead of fixed pixels. This allows layouts to adapt to different screen sizes.</p><h3>Media Queries</h3><p>Define different styles for different viewport sizes. Target specific breakpoints based on your content and user base.</p><h3>Testing Across Devices</h3><p>Test your design on actual devices and browsers. Browser developer tools provide useful testing capabilities, but nothing replaces real hardware testing.</p>",
    tags: ["Responsive Design", "CSS", "Mobile"],
  },
  {
    title: "GraphQL vs REST",
    content:
      "<h2>Comparing API Paradigms</h2><p>GraphQL offers an alternative to REST APIs with distinct advantages and trade-offs. Understanding both helps you choose the right approach.</p><h3>GraphQL Advantages</h3><p>Query only the data you need, eliminating over-fetching. Strong typing and introspection provide excellent developer experience. Single endpoint reduces complexity.</p><h3>REST Strengths</h3><p>REST is simpler to implement and understand. HTTP semantics are well-established. Caching infrastructure is mature and widely available.</p><h3>When to Choose Each</h3><p>GraphQL excels for complex, interconnected data. REST works well for simpler, more predictable APIs. Many organizations use both.</p>",
    tags: ["API Design", "GraphQL", "REST"],
  },
  {
    title: "Cloud Computing Fundamentals",
    content:
      "<h2>Understanding Cloud Services</h2><p>Cloud computing has transformed how we deploy and scale applications. Understanding the different service models is essential.</p><h3>IaaS, PaaS, and SaaS</h3><p>Infrastructure as a Service provides raw computing resources. Platform as a Service abstracts infrastructure. Software as a Service provides ready-to-use applications.</p><h3>Major Cloud Providers</h3><p>AWS, Google Cloud, and Azure dominate the market. Each offers similar services with different pricing and features.</p><h3>Advantages and Considerations</h3><p>Cloud provides scalability, reliability, and reduced operational overhead. Consider cost, vendor lock-in, and data residency requirements.</p>",
    tags: ["Cloud Computing", "AWS", "DevOps"],
  },
  {
    title: "Progressive Web Applications",
    content:
      "<h2>Building PWAs</h2><p>Progressive Web Applications combine the best of web and native applications. They work offline, load instantly, and provide app-like experiences.</p><h3>Service Workers</h3><p>Service workers intercept network requests and enable offline functionality. They also handle push notifications and background sync.</p><h3>Web App Manifest</h3><p>Define your PWA with a manifest file. Specify app name, icons, and launch behavior for installation on home screens.</p><h3>Offline-First Strategy</h3><p>Design your application to work offline. Use local storage and IndexedDB for data, and sync when connectivity returns.</p>",
    tags: ["PWA", "Web Development", "Performance"],
  },
  {
    title: "JavaScript Module Systems",
    content:
      "<h2>Understanding Modules</h2><p>JavaScript module systems allow code organization and reusability. Understanding different systems helps you work with various projects.</p><h3>CommonJS vs ES Modules</h3><p>CommonJS uses require() and module.exports. ES modules use import and export statements. Most modern projects use ES modules.</p><h3>Module Bundlers</h3><p>Tools like Webpack and Vite bundle modules for the browser. They handle dependencies, optimize code, and support various module formats.</p><h3>Tree Shaking</h3><p>Modern bundlers remove unused code, reducing bundle size. Write your code to be tree-shakeable for optimal bundle performance.</p>",
    tags: ["JavaScript", "Modules", "Build Tools"],
  },
  {
    title: "Artificial Intelligence Ethics",
    content:
      "<h2>Responsible AI Development</h2><p>As AI becomes more prevalent, ethical considerations become increasingly important. Developers have a responsibility to build fair, transparent systems.</p><h3>Bias in Machine Learning</h3><p>Training data reflects historical biases. Be aware of these biases and take steps to mitigate them. Monitor models for discriminatory outcomes.</p><h3>Transparency and Explainability</h3><p>Users should understand how AI systems make decisions. This is particularly important in high-stakes applications like hiring or lending.</p><h3>Privacy and Data Security</h3><p>Protect personal data used in training. Implement privacy-preserving techniques like differential privacy and federated learning.</p>",
    tags: ["AI Ethics", "Machine Learning", "Responsibility"],
  },
  {
    title: "Frontend Performance Optimization",
    content:
      "<h2>Making Websites Faster</h2><p>Frontend performance directly impacts user experience and SEO. Optimize every aspect of your site's loading and rendering.</p><h3>Code Splitting</h3><p>Load only necessary code for the initial page view. Split your bundle and load additional code when needed.</p><h3>Image Optimization</h3><p>Use modern formats like WebP. Serve appropriately sized images for different devices. Use lazy loading for below-the-fold images.</p><h3>Core Web Vitals</h3><p>Focus on Largest Contentful Paint, First Input Delay, and Cumulative Layout Shift. These metrics directly influence search rankings.</p>",
    tags: ["Performance", "Frontend", "Web Optimization"],
  },
  {
    title: "Regular Expressions Mastery",
    content:
      "<h2>Pattern Matching Power</h2><p>Regular expressions are powerful tools for pattern matching and text manipulation. Mastering them makes many tasks much easier.</p><h3>Regex Syntax</h3><p>Character classes, quantifiers, and anchors form the basis of regex. Learn common patterns like matching emails, URLs, and phone numbers.</p><h3>Performance Considerations</h3><p>Complex regex patterns can be slow. Understand backtracking and optimization techniques to avoid performance issues.</p><h3>Practical Applications</h3><p>Use regex for input validation, text extraction, and data parsing. Many programming tasks are simplified with well-crafted patterns.</p>",
    tags: ["Regular Expressions", "Programming", "Text Processing"],
  },
  {
    title: "API Authentication Methods",
    content:
      "<h2>Securing API Access</h2><p>Different authentication methods serve different needs. Choose the right approach based on your use case and security requirements.</p><h3>API Keys</h3><p>Simple but less secure. Suitable for public APIs with rate limiting. Always rotate keys and never commit them to version control.</p><h3>OAuth 2.0</h3><p>Industry standard for authorization. Enables third-party integrations without sharing passwords. Widely supported across platforms.</p><h3>JWT Authentication</h3><p>Self-contained tokens with claims. Stateless authentication suitable for APIs and microservices. Validate token signatures and check expiration.</p>",
    tags: ["API Security", "Authentication", "Backend"],
  },
  {
    title: "Monorepo Management",
    content:
      "<h2>Managing Multiple Projects</h2><p>Monorepos allow multiple projects in a single repository. Proper management prevents chaos and maintains developer productivity.</p><h3>Monorepo Tools</h3><p>Tools like Turborepo and Nx provide optimization and task orchestration. They accelerate builds by caching and parallelizing tasks.</p><h3>Dependency Management</h3><p>Use workspaces to manage dependencies. Ensure all projects use compatible versions of shared dependencies.</p><h3>Code Organization</h3><p>Organize code into clear packages. Use consistent naming conventions and establish guidelines for inter-package dependencies.</p>",
    tags: ["Monorepo", "Build Tools", "Project Management"],
  },
  {
    title: "Continuous Integration and Deployment",
    content:
      "<h2>Automating Software Delivery</h2><p>CI/CD pipelines automate testing and deployment. This enables rapid, reliable software delivery.</p><h3>Continuous Integration</h3><p>Run tests automatically on every commit. Catch issues early before they reach production. Maintain a working main branch at all times.</p><h3>Continuous Deployment</h3><p>Automatically deploy passing builds to production. Use feature flags to control rollout. Enable quick rollback if issues arise.</p><h3>Monitoring Deployments</h3><p>Monitor applications after deployment. Set up alerts for errors and performance degradation. Practice safe deployment strategies like canary releases.</p>",
    tags: ["CI/CD", "DevOps", "Automation"],
  },
  {
    title: "Web Performance Metrics",
    content:
      "<h2>Understanding Performance Data</h2><p>Metrics help you understand user experience and identify performance issues. Use data-driven approaches to optimization.</p><h3>Synthetic Monitoring</h3><p>Simulate user interactions from controlled environments. Useful for baseline performance testing and regression detection.</p><h3>Real User Monitoring</h3><p>Collect performance data from actual users. This reveals real-world performance across diverse devices and networks.</p><h3>Key Metrics</h3><p>Page load time, Time to First Byte, and Core Web Vitals are important. Track these metrics over time to measure improvements.</p>",
    tags: ["Performance Metrics", "Monitoring", "Web Analytics"],
  },
];

export async function seedDatabase(nextDatabaseUrl = databaseUrl) {
  try {
    console.log("🌱 Starting database seed...");

    if (nextDatabaseUrl !== databaseUrl) {
      throw new Error("Seed helper is already bound to a database URL.");
    }

    console.log("🧹 Resetting tables...");
    await db.execute(`truncate table posts, users restart identity cascade`);

    // Hash passwords
    const stevePasswordHash = await bcrypt.hash("pass123", 10);
    const mariaPasswordHash = await bcrypt.hash("pass123", 10);

    // Create users
    console.log("👤 Creating users...");
    const createdUsers = await db
      .insert(users)
      .values([
        {
          email: "steve@gmail.com",
          passwordHash: stevePasswordHash,
        },
        {
          email: "maria@gmail.com",
          passwordHash: mariaPasswordHash,
        },
      ])
      .returning({ id: users.id, email: users.email });

    const steveId = createdUsers[0].id;
    const mariaId = createdUsers[1].id;

    console.log(`✅ Created users: ${createdUsers.map((u) => u.email).join(", ")}`);

    // Create posts
    console.log("📝 Creating 30 blog posts...");

    const postsToInsert = samplePosts.map((post, index) => ({
      authorId: index < 15 ? steveId : mariaId,
      title: post.title,
      contentHtml: post.content,
      tags: post.tags,
      publishedAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ),
    }));

    await db.insert(posts).values(postsToInsert);

    console.log("✅ Created 30 blog posts");

    console.log("\n✨ Database seed completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - 2 users created`);
    console.log(`   - 30 blog posts created`);
    console.log(`   - Steve: 15 posts | Maria: 15 posts`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

const entryPoint = process.argv[1] ?? "";

if (entryPoint.includes("scripts\\seed.ts") || entryPoint.includes("scripts/seed.ts")) {
  void seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
