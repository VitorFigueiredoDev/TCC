import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const breakpoints = {
  sm: '30em',    // 480px
  md: '48em',    // 768px
  lg: '62em',    // 992px
  xl: '80em',    // 1280px
  '2xl': '96em', // 1536px
};

const theme = extendTheme({
  config,
  breakpoints,
  colors: {
    brand: {
      50: '#E6F2FF',
      100: '#C9E0FF',
      200: '#A3C9FF',
      300: '#7CB0FF',
      400: '#5596FF',
      500: '#3182CE',
      600: '#2667A5',
      700: '#1A4D7C',
      800: '#0F3452',
      900: '#051A29',
    },
  },
  fonts: {
    heading: 'Poppins, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        minHeight: '100vh',
        overflowX: 'hidden',
      },
      '#root': {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      },
      ':focus': {
        boxShadow: 'none !important',
        outline: 'none !important',
      },
      '.leaflet-container': {
        backgroundColor: props.colorMode === 'dark' ? '#2D3748' : '#EDF2F7',
      },
      '.map-container': {
        borderRadius: '8px',
        overflow: 'hidden',
      },
      '@media (max-width: 480px)': {
        html: {
          fontSize: '14px',
        },
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: 'semibold',
      },
      variants: {
        primary: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'brand.400' : 'brand.600',
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
          _active: {
            bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.700',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s ease-in-out',
        }),
      },
      defaultProps: {
        variant: 'primary',
      },
    },
    Container: {
      baseStyle: {
        maxW: { base: '100%', xl: '1280px' },
        px: { base: '1rem', md: '2rem' },
      },
    },
    Input: {
      variants: {
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'white',
              borderColor: 'brand.500',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Textarea: {
      variants: {
        filled: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          _hover: {
            bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
          },
          _focus: {
            bg: props.colorMode === 'dark' ? 'gray.600' : 'white',
            borderColor: 'brand.500',
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Select: {
      variants: {
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'white',
              borderColor: 'brand.500',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Box: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      }),
    },
  },
});

export default theme;