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
  Text,
} from "@chakra-ui/react";
import { CSVLink } from "react-csv";
import { MoonIcon, SunIcon, DeleteIcon, DownloadIcon, LockIcon } from "@chakra-ui/icons";
import logo from "./assets/gst-logo.svg";

const isValidURL = (url) => {
  // Expresión regular para validar si la URL es correcta
  const regex =
    /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z0-9]{2,3}(:\d+)?(\/[^\s]*)?$/i;
  return regex.test(url);
};

const fetchHTML = async (url) => {
  try {
    const corsAnywhereUrl = 'https://cors-anywhere.herokuapp.com/';
    const response = await fetch(corsAnywhereUrl + url);
    if (!response.ok)
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    return await response.text();
  } catch (error) {
    console.error(`Error obteniendo HTML de ${url}:`, error);
    return null;
  }
};

const evaluateXPath = (xpath, html) => {
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
};

const extractMetaData = async (url) => {
  const html = await fetchHTML(url);
  if (!html) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Determinar el tipo de página con prioridad
  let pageType = "N/A";
  if (doc.querySelector('section.internal-products')) {
    pageType = "PRO";
  } else if (doc.querySelector('div.container.article-internal')) {
    pageType = "ART";
  } else if (doc.querySelector("article")) {
    pageType = "COP";
  }

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
    PageType: pageType,
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
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);

  const normalizeURL = (url) => {
    // Si la URL no contiene http:// o https://, agregamos https:// por defecto
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // Si la URL contiene purina.com pero no tiene www, le agregamos www.
    if (
      /purina\.com/i.test(url) &&
      !/^www\./i.test(url.replace(/^https?:\/\//, ""))
    ) {
      url = url.replace(/^https?:\/\//, "https://www."); // Añadimos www si tiene purina.com en el dominio y no tiene www
    }

    return url;
  };

  // Uso en el código
  const handleExtract = async () => {
    setIsLoading(true);
    setError(""); // Limpiar error previo

    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url);

    // Verificamos si alguna URL es inválida antes de continuar
    const invalidUrls = urlList.filter((url) => !isValidURL(url));

    if (invalidUrls.length > 0) {
      setError(`Estas URLs no son válidas: ${invalidUrls.join(", ")}`);
      setIsLoading(false);
      return;
    }

    // Normalizamos las URLs antes de extraer datos
    const normalizedUrls = urlList.map(normalizeURL);

    const extractedData = await Promise.all(
      normalizedUrls.map(async (url) => {
        try {
          const result = await extractMetaData(url);
          if (!result) throw new Error(`No se pudo obtener datos de ${url}`);
          return result;
        } catch (err) {
          return {
            URL: url,
            error: "Error al procesar esta URL: " + err.message,
          };
        }
      }),
    );

    // Filtramos las respuestas
    const successfulData = extractedData.filter((item) => !item.error);
    const errorData = extractedData.filter((item) => item.error);

    setData(successfulData);
    setErrors(errorData);
    setIsLoading(false);
  };

  const handleClearText = () => {
    setUrls('');
    setError('');
  };

  const handleClear = () => {
    setUrls('');
    setData([]);
    setError('');
  };

  const getLinkCount = () => {
    return urls.split('\n').filter(url => url.trim()).length;
  };

  const csvData = data.map((item) => ({
    PageType: item.PageType,
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

  const handleCorsAccess = () => {
    window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
  };

  return (
    <ChakraProvider theme={extendTheme({ config: { initialColorMode: "system" } })}>
      <Box p={4} bg={colorMode === "dark" ? "gray.900" : "white"} color={colorMode === "dark" ? "white" : "black"} minHeight="100vh">
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
        {error && <Text color="red.500">{error}</Text>}{" "}
        {/* Mostramos el error si existe */}
        <Textarea
          placeholder="Ingrese URLs, una por línea"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          mb={4}
          resize="vertical"
        />
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Button
              onClick={handleExtract}
              isLoading={isLoading}
              mr={2}
              colorScheme={colorMode === "light" ? "yellow" : "blue"}
            >
              Extraer Datos
            </Button>
            <Button
              onClick={handleClear}
              mr={2}
              colorScheme="red"
              aria-label="Limpiar todo"
              w="40px"
              p="0"
            >
              <DeleteIcon />
            </Button>
            <CSVLink data={csvData} filename="extracted_data.csv">
              <Button
                colorScheme="green"
                title="Descargar CSV"
                aria-label="Descargar CSV"
                w="40px"
                p="0"
                mr={2}
              >
                <DownloadIcon />
              </Button>
            </CSVLink>
            <IconButton
              icon={<LockIcon />}
              colorScheme="purple"
              aria-label="Solicitar acceso CORS"
              onClick={handleCorsAccess}
              w="40px"
              p="0"
            />
          </Box>
          <Text color="gray.600" fontSize="sm">
            <b>Enlaces ingresados:</b> {getLinkCount()}
          </Text>
        </Flex>
        {/* Mostrar la tabla con los datos extraídos */}
        <Box overflowX="auto" maxWidth="100%">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>URL</Th>
                <Th>GeoPlaceName</Th>
                <Th>GeoRegion</Th>
                <Th>Speakable</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item, index) => (
                <Tr key={index}>
                  <Td>{item.PageType}</Td>
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
