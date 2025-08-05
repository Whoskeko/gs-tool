import React, { useState } from 'react';
import {
  Box,
  Button,
  Textarea,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  HStack,
  Flex,
  Divider,
  Tooltip,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { DeleteIcon, LockIcon } from '@chakra-ui/icons';

const getContentType = (doc) => {
  // Detectar artículo por su clase específica
  if (doc.querySelector('article.content-format--article.content_expertize--standard.content-source--standard')) {
    return {
      type: 'ART',
      element: 'article.content-format--article'
    };
  }
  
  // Detectar receta por su clase específica
  if (doc.querySelector('article.content-format--.content-source--')) {
    return {
      type: 'REC',
      element: 'article.content-format--'
    };
  }

  // Detectar landing page por estructura específica
  if (doc.querySelector('article div.paragraph.full-width.paragraph-hero.hero-without-image')) {
    return {
      type: 'LAN',
      element: 'article > div.paragraph-hero'
    };
  }

  // Si no coincide con ningún patrón conocido
  return {
    type: 'UNK',
    element: null
  };
};

const getSchemaStatus = (schemas) => {
  if (!schemas || schemas.length === 0) {
    return {
      colorScheme: 'red',
      message: 'No se encontró ningún schema.',
      schema: null
    };
  }

  const articleSchema = schemas.find(s => s['@type'] === 'Article');
  const schemaTypes = [...new Set(schemas.map(s => s['@type']))];

  if (!articleSchema) {
    return {
      colorScheme: 'yellow',
      message: 'No se encontró schema tipo Article.\nOtros schemas encontrados: ' + schemaTypes.join(', '),
      schema: schemas[0]
    };
  }

  return {
    colorScheme: 'green',
    message: null,
    schema: articleSchema
  };
};

const getSchemaInfo = (doc, schemas) => {
  // Detectar tipo de página por DOM
  const contentType = getContentType(doc);

  // Determinar estado del schema
  const schemaStatus = getSchemaStatus(schemas);

  return {
    type: contentType,
    ...schemaStatus
  };
};

const extractSchemaFields = (schema) => {
  if (!schema) return null;

  const getAuthorInfo = (author) => ({
    type: author?.['@type'] || (typeof author === 'string' ? 'String' : 'N/A'),
    name: typeof author === 'string' ? author : author?.name || 'N/A',
    url: author?.url || 'N/A'
  });

  const getPublisherInfo = (publisher) => ({
    type: publisher?.['@type'] || (typeof publisher === 'string' ? 'String' : 'N/A'),
    name: typeof publisher === 'string' ? publisher : publisher?.name || 'N/A',
    logo: publisher?.logo?.url || publisher?.logo || 'N/A'
  });

  return {
    schemaType: schema['@type'] || 'N/A',
    headline: schema.headline || 'N/A',
    name: schema.name || 'N/A',
    description: schema.description || schema.about || 'N/A',
    datePublished: schema.datePublished || 'N/A',
    dateModified: schema.dateModified || 'N/A',
    mainEntityOfPage: schema.mainEntityOfPage || 'N/A',
    imageUrl: typeof schema.image === 'string' ? schema.image : schema.image?.url || 'N/A',
    author: getAuthorInfo(schema.author),
    publisher: getPublisherInfo(schema.publisher)
  };
};

const DataRow = ({ label, value }) => (
  <HStack w="full" spacing={4} py={2}>
    <Text fontWeight="bold" minW="160px">{label}:</Text>
    <Text flex={1}>{value}</Text>
  </HStack>
);

const ArticleData = ({ info, schemaInfo }) => (
  <VStack w="full" align="stretch" spacing={4}>
    {schemaInfo.message && (
      <Box 
        p={3} 
        bg={schemaInfo.color === 'red' ? 'red.100' : 'yellow.100'} 
        color={schemaInfo.color === 'red' ? 'red.800' : 'yellow.800'} 
        borderRadius="md"
      >
        <Text whiteSpace="pre-line">{schemaInfo.message}</Text>
      </Box>
    )}
    
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>Schema</Text>
      <DataRow label="Type" value={info.schemaType} />
    </Box>
    
    <Divider />
    
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>Títulos</Text>
      <DataRow label="Headline" value={info.headline} />
      <DataRow label="Name" value={info.name} />
    </Box>
    
    <Divider />
    
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>Contenido</Text>
      <DataRow label="Description" value={info.description} />
    </Box>
    
    <Divider />
    
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>Autor</Text>
      <DataRow label="Author Type" value={info.author.type} />
      <DataRow label="Author Name" value={info.author.name} />
      <DataRow label="Author URL" value={info.author.url} />
    </Box>
    
    <Divider />
    
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>Publicación</Text>
      <DataRow label="Publisher Type" value={info.publisher.type} />
      <DataRow label="Publisher Name" value={info.publisher.name} />
      <DataRow label="Publisher Logo" value={info.publisher.logo} />
    </Box>
    
    <Divider />
    
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>Fechas</Text>
      <DataRow label="Published" value={info.datePublished} />
      <DataRow label="Modified" value={info.dateModified} />
    </Box>
    
    <Divider />
    
    <Box>
      <Text fontSize="sm" color="gray.500" mb={2}>Metadatos</Text>
      <DataRow label="Image URL" value={info.imageUrl} />
      <DataRow label="Main Entity" value={info.mainEntityOfPage} />
    </Box>
  </VStack>
);

export default function Nutrition({ colorMode }) {
  const [urls, setUrls] = useState('');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const extractSchemaData = (html, url) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const schemas = [];

    // Extraer schemas
    doc.querySelectorAll("script[type='application/ld+json']").forEach((script) => {
      try {
        const json = JSON.parse(script.textContent);
        const items = json['@graph'] || [json];
        items.forEach(item => {
          if (item['@type']) schemas.push(item);
        });
      } catch (error) {
        console.error('Error parsing JSON-LD:', error);
      }
    });

    // Determinar tipo de página por DOM
    const { type, element } = getContentType(doc);
    const schemaStatus = getSchemaStatus(schemas);

    return {
      url,
      type,              // ART/REC/UNK basado en DOM
      element,           // elemento DOM encontrado
      ...schemaStatus,   // estado y color del schema
      fields: schemaStatus.schema ? extractSchemaFields(schemaStatus.schema) : null
    };
  };

  const handleExtract = async () => {
    setIsLoading(true);
    setError('');

    const urlList = urls.split('\n').map(url => url.trim()).filter(url => url);
    const results = [];

    for (const url of urlList) {
      try {
        const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
        const html = await response.text();
        const schemasData = extractSchemaData(html, url);
        
        if (schemasData) {
          results.push(schemasData);
        }
      } catch (err) {
        console.error(`Error processing ${url}:`, err);
        setError(prev => prev + `\nError en ${url}: ${err.message}`);
      }
    }

    setData(results);
    setIsLoading(false);
  };

  const handleCorsAccess = () => {
    window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
  };

  return (
    <Box p={4} w="100%" bg={colorMode === "dark" ? "gray.900" : "white"} color={colorMode === "dark" ? "white" : "black"} minH="100vh">
      <Textarea
        placeholder="Ingrese URLs de artículos, una por línea"
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
            Extraer Artículos
          </Button>
          <Button
            onClick={() => {
              setUrls('');
              setData([]);
              setError('');
            }}
            colorScheme="red"
            aria-label="Limpiar todo"
            w="40px"
            p="0"
            mr={2}
          >
            <DeleteIcon />
          </Button>
          <Tooltip label="Solicitar acceso CORS">
            <IconButton
              icon={<LockIcon />}
              colorScheme="purple"
              aria-label="Solicitar acceso CORS"
              onClick={handleCorsAccess}
              w="40px"
              p="0"
            />
          </Tooltip>
        </Box>
      </Flex>

      {error && <Text color="red.500" mb={4}>{error}</Text>}

      {data.length > 0 && (
        <Accordion allowMultiple>
          {data.map((item, index) => (
            <AccordionItem 
              key={index} 
              mb={4}
              border="1px solid"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              borderRadius="md"
              overflow="hidden"
            >
              <AccordionButton>
                <HStack flex={1} spacing={4}>
                  <Badge 
                    colorScheme={item.colorScheme}
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {item.type}
                  </Badge>
                  <Text flex={1} textAlign="left">{item.url}</Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
              
              <AccordionPanel 
                p={6}
                bg={colorMode === "dark" ? "gray.800" : "white"}
                borderTop="1px solid"
                borderTopColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              >
                {item.fields ? (
                  <ArticleData info={item.fields} schemaInfo={item} />
                ) : (
                  <Box 
                    p={3} 
                    bg="red.100"
                    color="red.800"
                    borderRadius="md"
                  >
                    <Text>{item.message}</Text>
                  </Box>
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Box>
  );
}