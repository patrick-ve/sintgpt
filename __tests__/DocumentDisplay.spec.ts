import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import DocumentDisplay from '../components/DocumentDisplay.vue'; // Adjust path if necessary

// Mock vue-pdf-embed
vi.mock('vue-pdf-embed', () => {
  return {
    default: {
      name: 'VuePdfEmbed',
      props: ['source', 'page', 'width'],
      template: '<div data-testid="vue-pdf-embed-mock"></div>',
    },
  };
});

interface DocumentDisplayProps {
  documentSource: string | File;
  initialPage?: number;
}

const createMockFile = (name: string, type: string): File => {
  return new File([''], name, { type });
};

describe('DocumentDisplay.vue', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = (props: DocumentDisplayProps) => {
    return mount(DocumentDisplay, {
      props,
      global: {
        stubs: {
          // If we weren't fully mocking vue-pdf-embed via vi.mock,
          // we could stub it here too.
        },
      },
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  it('renders correctly when mounted', () => {
    wrapper = mountComponent({ documentSource: 'test.jpg' });
    expect(wrapper.exists()).toBe(true);
  });

  describe('Image Display', () => {
    it('renders an img tag for image file types (jpg)', async () => {
      const imageFile = createMockFile('document.jpg', 'image/jpeg');
      wrapper = mountComponent({ documentSource: imageFile });
      await nextTick();
      expect(wrapper.find('img').exists()).toBe(true);
      expect(
        wrapper.find('[data-testid="vue-pdf-embed-mock"]').exists()
      ).toBe(false);
    });

    it('renders an img tag for image file types (png)', async () => {
      const imageFile = createMockFile('document.png', 'image/png');
      wrapper = mountComponent({ documentSource: imageFile });
      await nextTick();
      expect(wrapper.find('img').exists()).toBe(true);
      expect(
        wrapper.find('[data-testid="vue-pdf-embed-mock"]').exists()
      ).toBe(false);
    });

    it('sets the src attribute correctly for image URLs', async () => {
      const imageUrl = 'http://example.com/image.png';
      wrapper = mountComponent({ documentSource: imageUrl });
      await nextTick();
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe(imageUrl);
    });

    it('sets the src attribute correctly for image File objects', async () => {
      const imageFile = createMockFile('document.tiff', 'image/tiff');
      wrapper = mountComponent({ documentSource: imageFile });
      await nextTick();
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      // For File objects, the src will be a Blob URL
      expect(img.attributes('src')).toMatch(/^blob:/);
    });
  });

  describe('PDF Display', () => {
    it('renders vue-pdf-embed for PDF file type', async () => {
      const pdfFile = createMockFile(
        'document.pdf',
        'application/pdf'
      );
      wrapper = mountComponent({ documentSource: pdfFile });
      await nextTick();
      expect(
        wrapper.find('[data-testid="vue-pdf-embed-mock"]').exists()
      ).toBe(true);
      expect(wrapper.find('img').exists()).toBe(false);
    });

    it('renders vue-pdf-embed for PDF URLs', async () => {
      const pdfUrl = 'http://example.com/document.pdf';
      wrapper = mountComponent({ documentSource: pdfUrl });
      await nextTick();
      expect(
        wrapper.find('[data-testid="vue-pdf-embed-mock"]').exists()
      ).toBe(true);
      expect(wrapper.find('img').exists()).toBe(false);
    });

    it('passes the correct source prop to vue-pdf-embed for File objects', async () => {
      const pdfFile = createMockFile(
        'document.pdf',
        'application/pdf'
      );
      wrapper = mountComponent({ documentSource: pdfFile });
      await nextTick();
      const pdfEmbedMock = wrapper.findComponent({
        name: 'VuePdfEmbed',
      });
      expect(pdfEmbedMock.props('source')).toEqual(
        expect.any(String)
      );
    });

    it('passes the correct source prop to vue-pdf-embed for URLs', async () => {
      const pdfUrl = 'http://example.com/document.pdf';
      wrapper = mountComponent({ documentSource: pdfUrl });
      await nextTick();
      const pdfEmbedMock = wrapper.findComponent({
        name: 'VuePdfEmbed',
      });
      expect(pdfEmbedMock.props('source')).toBe(pdfUrl);
    });

    it('passes the page prop to vue-pdf-embed', async () => {
      const pdfFile = createMockFile(
        'document.pdf',
        'application/pdf'
      );
      wrapper = mountComponent({
        documentSource: pdfFile,
        initialPage: 5,
      });
      await nextTick();
      const pdfEmbedMock = wrapper.findComponent({
        name: 'VuePdfEmbed',
      });
      expect(pdfEmbedMock.props('page')).toBe(5);
    });

    it('defaults page prop to 1 if not provided for vue-pdf-embed', async () => {
      const pdfFile = createMockFile(
        'document.pdf',
        'application/pdf'
      );
      wrapper = mountComponent({ documentSource: pdfFile });
      await nextTick();
      const pdfEmbedMock = wrapper.findComponent({
        name: 'VuePdfEmbed',
      });
      expect(pdfEmbedMock.props('page')).toBe(1);
    });
  });

  describe('Controls', () => {
    beforeEach(() => {
      // Mount with a generic source for controls tests
      wrapper = mountComponent({ documentSource: 'test.jpg' });
    });

    it('renders a zoom-in button', () => {
      expect(
        wrapper.find('button[aria-label="Zoom in"]').exists()
      ).toBe(true);
    });

    it('renders a zoom-out button', () => {
      expect(
        wrapper.find('button[aria-label="Zoom out"]').exists()
      ).toBe(true);
    });

    it('renders a reset-zoom button', () => {
      expect(
        wrapper.find('button[aria-label="Reset zoom"]').exists()
      ).toBe(true);
    });

    // Pan controls might be more complex (e.g., direct interaction or specific buttons)
    // For now, let's assume some pan buttons or a general control area
    it('renders a pan-up button', () => {
      expect(
        wrapper.find('button[aria-label="Pan up"]').exists()
      ).toBe(true);
    });
    it('renders a pan-down button', () => {
      expect(
        wrapper.find('button[aria-label="Pan down"]').exists()
      ).toBe(true);
    });
    it('renders a pan-left button', () => {
      expect(
        wrapper.find('button[aria-label="Pan left"]').exists()
      ).toBe(true);
    });
    it('renders a pan-right button', () => {
      expect(
        wrapper.find('button[aria-label="Pan right"]').exists()
      ).toBe(true);
    });
  });

  // Add more tests later for:
  // - Emitted events (e.g., on-zoom, on-pan, on-page-change)
  // - Interaction with zoom/pan buttons and their effect
  // - Error handling for invalid sources or unsupported file types
  // - Accessibility attributes for controls
});
