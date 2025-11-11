/* eslint-disable */
import '@testing-library/jest-dom/vitest';
import { config } from '@vue/test-utils';
import { h } from 'vue';

// Stub NuxtLink
config.global.stubs.NuxtLink = {
  props: ['to'],
  setup(props, { slots }) {
    // Render a simple anchor tag or a span, passing the 'to' prop as href or data attribute
    // and rendering the default slot content.
    return () =>
      h(
        'a',
        { href: props.to || '#' },
        slots.default ? slots.default() : []
      );
  },
};

// Stub NuxtImage
config.global.stubs.NuxtImg = {
  // Use NuxtImg as that's the likely component name used internally or via auto-import
  props: ['src', 'alt'],
  setup(props) {
    // Render a simple img tag with src and alt attributes.
    return () =>
      h('img', { src: props.src || '', alt: props.alt || '' });
  },
};

// Stub NuxtPicture (just in case it's used)
config.global.stubs.NuxtPicture = {
  props: ['src', 'alt'],
  setup(props) {
    // Render a simple img tag, similar to NuxtImg stub
    return () =>
      h('img', { src: props.src || '', alt: props.alt || '' });
  },
};
