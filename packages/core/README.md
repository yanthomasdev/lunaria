# `@lunariajs/core`

The `@lunariajs/core` package contains the base tracking and dashboard generation systems used across its related packages. You should use this package if:

- You need fine-grained control over your dashboard
- You want to build a package over it
- There isn't a framework-specific `@lunariajs` package for your use-case

## Installation

You can install `@lunariajs/core` using your preferred package manager:

```bash
# npm
npm install @lunariajs/core

# pnpm
pnpm add @lunariajs/core

# yarn
yarn add @lunariajs/core
```

## Basic Usage

Start using `@lunariajs/core` by setting up your own `lunaria.config.json` file and adding a script to your `package.json` file.

The example below contains all of the **required** options to generate a dashboard tracking the status of both the Portuguese and Spanish translations of a site:

```json
// lunaria.config.json
{
  "repository": "https://github.com/me/cool-docs",
  "dashboard": {
    "url": "https://tracker.cool-docs.com"
  },
  "defaultLocale": {
    "label": "English",
    "lang": "en",
    "content": {
      "location": "content/en/**/*.md"
    }
  },
  "locales": [
    {
      "label": "Português",
      "lang": "pt",
      "content": {
        "location": "content/pt/**/*.md"
      }
    },
    {
      "label": "Spanish",
      "lang": "es",
      "content": {
        "location": "content/es/**/*.md"
      }
    }
  ]
});
```

Now, you need to add a new script to your `package.json` file to trigger a dashboard build during your website's deploy process, like so:

```diff
"scripts": {
    "docs:dev": "vitepress dev .",
    "docs:build": "vitepress build .",
    "docs:preview": "vitepress preview .",
+   "translation-status": "lunaria"
  },
```

Want other usage examples? Head over to the [`examples/` directory](https://github.com/Yan-Thomas/lunaria/tree/main/examples/) and inspect the source code for tips & tricks about using `@lunariajs/core` with other frameworks and environments.
