---
title: Introducing Lunaria
excerpt: 
  Lunaria is a complete localization management toolchain built especially for open-source projects. Currently, Lunaria is already being used in production to help track over 5000 content files in over a dozen of locales in big projects such as [Astro](https://i18n.docs.astro.build/), [Starlight](https://i18n.starlight.astro.build/), [SolidJS](https://docs.solidjs.com/i18n-status/), and [VitePress](https://vitepress.dev/_translations/).
date: 2024-05-21
authors:
  name: Yan Thomas
  title: Maintainer
  picture: https://avatars.githubusercontent.com/u/61414485
  url: https://github.com/yanthomasdev/
---

Lunaria is a complete localization management toolchain built especially for open-source projects. Currently, Lunaria is already being used in production to help track over 5000 content files in over a dozen of locales in big projects such as [Astro](https://i18n.docs.astro.build/), [Starlight](https://i18n.starlight.astro.build/), [SolidJS](https://docs.solidjs.com/i18n-status/), and [VitePress](https://vitepress.dev/_translations/).

:::tip[Ready to get started?]
Read the official ["Getting Started" guide](https://lunaria.dev/getting-started/) to learn more about and set up Lunaria in your project. 
:::

## What's it all about?

Lunaria was created with the intent to share Astro Docs' own internationalization infrastructure with the wider open-source community -- In fact, Lunaria was first hinted at in the ["How Astro does i18n" blog post](https://astro.build/blog/astro-i18n/#going-forward). Originally developed by [@hippotastic](https://github.com/hippotastic), the before coined "Translation Tracker" was fully redesigned to support a wide variety of different content authoring formats, file structures, and frameworks one might be building their project with.

Maintaining a project for an international audience is no easy task! It involves a lot of effort from both contributors and maintainers to build a sustainable workflow for content to be progressively and consistently localized. Lunaria helps your project by making this effortless -- within a few minutes, you can get a fully tracked project with a dashboard on top that you can share with your contributors to rapidly get into action, all while keeping changes in sync thanks to Lunaria's custom tracking system powered by Git.

And that's not all! Lunaria is **free and open-source software** (FOSS). No sign-ups are needed, and no giving up ownership of your content to another platform. Lunaria's sole goal is -- and will always be -- to help you make the world more inclusive, accessible, and globalized. 

## Current status

Today marks the release of Lunaria v0.1. This minor release means that Lunaria is ready to be tested and used in production. This release is also an important step to gather more diversified feedback on how Lunaria can mature into a more complete, fast, and stable library in the future.

As mentioned before, Lunaria is a *toolchain* and comes with different packages meant to help you integrate with, or improve the experience of using Lunaria. Today *also* marks the v0.1 release of the official [Lunaria GitHub Action](https://lunaria.dev/integrations/github-action/) and the [Lunaria integration for Starlight](https://lunaria.dev/integrations/github-action/).

:::caution[Breaking changes]
During this stage, breaking changes should be expected across all officially maintained packages. If you find anything wrong or unexpected, please [open an issue on GitHub](https://github.com/yanthomasdev/lunaria/issues/new/choose)!
:::

## Onward

In response to feedback given, Lunaria will receive constant updates with bug fixes, miscellaneous quality improvements, and brand-new features. At the same time, a lot of brainstorming will happen in the background (and later publicly) on how Lunaria can shape up to be even better in the future -- and believe me, I have lots of ideas!

As usual, maintaining an open-source project is a lot of work, especially when you're an unemployed and broke college student from Latin America. Fortunately, I've been lucky to have received support from [Astro](https://astro.build/) to dedicate some of my time to Lunaria these past months and bring it to its current state.

If your company or project uses Lunaria, supporting it through [GitHub Sponsors](https://github.com/sponsors/yanthomasdev) would go a long way into helping it be maintained in the foreseeable future, and even better, allow me to live sustainably working full-time on open-source.

As a final -- and quite personal -- aside, Lunaria is the first open-source project and package I wrote and led. To build something like this in public is, to be quite honest, frightening. For all those understanding and kind enough to test it and share your constructive feedback, thank you! 


