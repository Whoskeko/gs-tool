import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "system",
    useSystemColorMode: true,
  },
  styles: {
    global: (props) => ({
      "html, body": {
        color: props.colorMode === "dark" ? "white" : "black",
        bg: props.colorMode === "dark" ? "gray.900" : "white",
        transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
      },
    }),
  },
});

export default theme;

