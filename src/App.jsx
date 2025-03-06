import { useState, useEffect } from "react";
import {
  ChakraProvider,
  Box,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorMode,
  extendTheme,
  Textarea,
  IconButton,
  Image,
  Flex,
} from "@chakra-ui/react";
import { CSVLink } from "react-csv";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import logo from "./assets/gst-logo.svg";

function evaluateXPath(xpath, html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const result = [];
  const nodes = doc.evaluate(
    xpath,
    doc,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );
  for (let i = 0; i < nodes.snapshotLength; i++) {
    result.push(nodes.snapshotItem(i).textContent);
  }
  return result.join(", "); // Join multiple values with a comma
}

const fetchHTML = async (url) => {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
};

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

const extractMetaData = async (url) => {
  const html = await fetchHTML(url);
  if (!html) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const geoPlaceName =
    doc.querySelector("meta[name='geo.placename']")?.content || "N/A";
  const geoRegion =
    doc.querySelector("meta[name='geo.region']")?.content || "N/A";

  const speakableData = [];
  doc.querySelectorAll("script[type='application/ld+json']").forEach((elem) => {
    try {
      const json = JSON.parse(elem.textContent);
      if (json["@graph"]) {
        json["@graph"].forEach((item) => {
          if (item.speakable) {
            const speakableItems = item.speakable.xpath || [];
            speakableItems.forEach((xpath) => {
              const value = evaluateXPath(xpath, html);
              speakableData.push({
                Type: item.speakable["@type"] || "Unknown Type",
                XPath: xpath,
                Value: value,
              });
            });
          }
        });
      }
    } catch (error) {
      console.error("Error parsing JSON-LD:", error);
    }
  });

  return {
    URL: url,
    GeoPlaceName: geoPlaceName,
    GeoRegion: geoRegion,
    Speakable: speakableData,
  };
};

const App = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [urls, setUrls] = useState("");
  const [data, setData] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const handleExtract = async () => {
    setIsLoading(true);
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url);
    const extractedData = await Promise.all(urlList.map(extractMetaData));
    setData(extractedData.filter(Boolean));
    setIsLoading(false);
  };

  const csvData = data.map((item) => ({
    URL: item.URL,
    GeoPlaceName: item.GeoPlaceName,
    GeoRegion: item.GeoRegion,
    Speakable:
      item.Speakable.length > 0
        ? item.Speakable.map(
            (s) => `Type: ${s.Type}, XPath: ${s.XPath}, Value: ${s.Value}`,
          ).join(" | ")
        : "No Speakable Data",
  }));

  useEffect(() => {
    const savedUrls = localStorage.getItem("urls");
    if (savedUrls) setUrls(savedUrls);
  }, []);

  useEffect(() => {
    localStorage.setItem("urls", urls);
  }, [urls]);

  return (
    <ChakraProvider theme={theme}>
      <Box
        p={4}
        bg={colorMode === "dark" ? "gray.900" : "white"}
        color={colorMode === "dark" ? "white" : "black"}
        minHeight="100vh"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Image
            src={logo}
            ml="5"
            alt="gst logo"
            boxSize="100px"
            filter={colorMode === "dark" ? "invert(1)" : "none"}
          />
          <IconButton
            onClick={toggleColorMode}
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            aria-label="Toggle Dark Mode"
            borderRadius="full"
            mr="5"
            colorScheme={colorMode === "light" ? "yellow" : "blue"}
          />
        </Flex>

        <Textarea
          placeholder="Ingrese URLs, una por línea"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          mb={4}
          resize="vertical"
        />
        <Button
          onClick={handleExtract}
          isLoading={isLoading}
          mb={4}
          mr={2}
          colorScheme={colorMode === "light" ? "yellow" : "blue"}
        >
          Extraer Datos
        </Button>
        <CSVLink data={csvData} filename="extracted_data.csv">
          <Button
            mb={4}
            colorScheme={colorMode === "light" ? "yellow" : "blue"}
          >
            Descargar CSV
          </Button>
        </CSVLink>

        <Box overflowX="auto" maxWidth="100%">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>URL</Th>
                <Th>GeoPlaceName</Th>
                <Th>GeoRegion</Th>
                <Th>Speakable</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item, index) => (
                <Tr key={index}>
                  <Td>{item.URL}</Td>
                  <Td>{item.GeoPlaceName}</Td>
                  <Td>{item.GeoRegion}</Td>
                  <Td>
                    {item.Speakable.length > 0
                      ? item.Speakable.map((s, i) => (
                          <Box key={i} mb={2}>
                            <b>Type:</b> {s.Type} <br />
                            <b>XPath:</b> {s.XPath} <br />
                            <b>Value:</b> {s.Value}
                          </Box>
                        ))
                      : "No Speakable Data"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default App;
