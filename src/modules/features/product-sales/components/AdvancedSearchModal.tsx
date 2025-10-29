/**
 * Advanced Search Modal for Product Sales
 * Provides multi-field search with suggestions and saved search queries
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  Tag,
  Row,
  Col,
  Divider,
  AutoComplete,
  Checkbox,
  List,
  Empty,
} from 'antd';
import { DeleteOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';

export interface SearchQuery {
  id: string;
  name: string;
  query: AdvancedSearchInputs;
  createdAt: string;
}

export interface AdvancedSearchInputs {
  sale_id?: string;
  customer_name?: string;
  product_name?: string;
  notes?: string;
  full_text?: string;
}

interface AdvancedSearchModalProps {
  visible: boolean;
  onSearch: (searchInputs: AdvancedSearchInputs) => void;
  onClose: () => void;
}

const STORAGE_KEY_SEARCHES = 'productSalesAdvancedSearches';
const STORAGE_KEY_SUGGESTIONS = 'productSalesSearchSuggestions';

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  visible,
  onSearch,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [queryName, setQueryName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [useFullText, setUseFullText] = useState(false);

  // Load saved searches and suggestions from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem(STORAGE_KEY_SEARCHES);
    if (savedSearches) {
      try {
        setSearchQueries(JSON.parse(savedSearches));
      } catch (error) {
        console.error('Error loading searches:', error);
      }
    }

    const savedSuggestions = localStorage.getItem(STORAGE_KEY_SUGGESTIONS);
    if (savedSuggestions) {
      try {
        setSuggestions(JSON.parse(savedSuggestions));
      } catch (error) {
        console.error('Error loading suggestions:', error);
      }
    }
  }, []);

  // Get autocomplete options from suggestions
  const getAutoCompleteOptions = useCallback(() => {
    return suggestions.map(suggestion => ({
      label: suggestion,
      value: suggestion,
    }));
  }, [suggestions]);

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();

      // Build search inputs based on checkbox selection
      const searchInputs: AdvancedSearchInputs = {};

      if (useFullText && values.full_text) {
        searchInputs.full_text = values.full_text;
      } else {
        if (values.sale_id) searchInputs.sale_id = values.sale_id;
        if (values.customer_name) searchInputs.customer_name = values.customer_name;
        if (values.product_name) searchInputs.product_name = values.product_name;
        if (values.notes) searchInputs.notes = values.notes;
      }

      // Add to suggestions if it's a new search
      const searchString = values.full_text || 
        `${values.sale_id || ''} ${values.customer_name || ''} ${values.product_name || ''}`.trim();
      
      if (searchString && !suggestions.includes(searchString)) {
        const updatedSuggestions = [searchString, ...suggestions].slice(0, 10);
        setSuggestions(updatedSuggestions);
        localStorage.setItem(STORAGE_KEY_SUGGESTIONS, JSON.stringify(updatedSuggestions));
      }

      onSearch(searchInputs);
      message.success('Search executed successfully');
      onClose();
    } catch (error) {
      console.error('Error executing search:', error);
    }
  };

  const handleResetSearch = () => {
    form.resetFields();
    setUseFullText(false);
    setQueryName('');
  };

  const handleSaveSearch = async () => {
    if (!queryName.trim()) {
      message.error('Please enter a search name');
      return;
    }

    try {
      const values = form.getFieldsValue();
      const newQuery: SearchQuery = {
        id: `search_${Date.now()}`,
        name: queryName,
        query: {
          sale_id: values.sale_id,
          customer_name: values.customer_name,
          product_name: values.product_name,
          notes: values.notes,
          full_text: values.full_text,
        },
        createdAt: new Date().toISOString(),
      };

      const updatedQueries = [...searchQueries, newQuery];
      setSearchQueries(updatedQueries);
      localStorage.setItem(STORAGE_KEY_SEARCHES, JSON.stringify(updatedQueries));
      setQueryName('');
      message.success('Search saved successfully');
    } catch (error) {
      message.error('Failed to save search');
      console.error('Error saving search:', error);
    }
  };

  const handleLoadSearch = (query: SearchQuery) => {
    form.setFieldsValue({
      sale_id: query.query.sale_id,
      customer_name: query.query.customer_name,
      product_name: query.query.product_name,
      notes: query.query.notes,
      full_text: query.query.full_text,
    });
    setUseFullText(!!query.query.full_text);
    message.success(`Search "${query.name}" loaded`);
  };

  const handleDeleteSearch = (id: string) => {
    const updatedQueries = searchQueries.filter(q => q.id !== id);
    setSearchQueries(updatedQueries);
    localStorage.setItem(STORAGE_KEY_SEARCHES, JSON.stringify(updatedQueries));
    message.success('Search deleted');
  };

  const handleSuggestionSelect = (value: string) => {
    form.setFieldValue('full_text', value);
    setUseFullText(true);
  };

  return (
    <Modal
      title="Advanced Search"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleResetSearch}>Reset</Button>
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            Search
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {/* Full-text vs Field Search Toggle */}
        <Form.Item>
          <Checkbox 
            checked={useFullText}
            onChange={(e) => setUseFullText(e.target.checked)}
          >
            Use full-text search across all fields
          </Checkbox>
        </Form.Item>

        {/* Full-Text Search */}
        {useFullText && (
          <Form.Item 
            label="Full-Text Search" 
            name="full_text"
            rules={[{ message: 'Please enter a search term' }]}
          >
            <AutoComplete
              placeholder="Search across all fields..."
              options={getAutoCompleteOptions()}
              onSelect={handleSuggestionSelect}
              filterOption={(inputValue, option) =>
                (option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
        )}

        {/* Field-Specific Search */}
        {!useFullText && (
          <>
            <Form.Item 
              label="Sale ID" 
              name="sale_id"
            >
              <Input 
                placeholder="Search by sale ID (e.g., SALE-001)" 
                allowClear
              />
            </Form.Item>

            <Form.Item 
              label="Customer Name" 
              name="customer_name"
            >
              <AutoComplete
                placeholder="Search by customer name..."
                options={getAutoCompleteOptions()}
                onSelect={(value) => form.setFieldValue('customer_name', value)}
                filterOption={(inputValue, option) =>
                  (option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item 
              label="Product Name" 
              name="product_name"
            >
              <Input 
                placeholder="Search by product name" 
                allowClear
              />
            </Form.Item>

            <Form.Item 
              label="Notes/Comments" 
              name="notes"
            >
              <Input.TextArea 
                placeholder="Search in notes and comments" 
                allowClear
                rows={3}
              />
            </Form.Item>
          </>
        )}
      </Form>

      {/* Recent Suggestions */}
      {suggestions.length > 0 && (
        <>
          <Divider>Recent Searches</Divider>
          <div style={{ marginBottom: 16 }}>
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <Tag 
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                style={{ cursor: 'pointer', marginBottom: 8 }}
              >
                {suggestion}
              </Tag>
            ))}
          </div>
        </>
      )}

      {/* Save Current Search */}
      <Divider>Save Search Query</Divider>
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Input
            placeholder="Enter a name for this search"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            onPressEnter={handleSaveSearch}
          />
        </Col>
        <Col span={8}>
          <Button
            block
            icon={<SaveOutlined />}
            onClick={handleSaveSearch}
          >
            Save Query
          </Button>
        </Col>
      </Row>

      {/* Saved Search Queries */}
      {searchQueries.length > 0 && (
        <>
          <Divider>Saved Search Queries</Divider>
          <List
            dataSource={searchQueries}
            renderItem={(query) => (
              <List.Item
                key={query.id}
                actions={[
                  <Button
                    type="link"
                    onClick={() => handleLoadSearch(query)}
                    size="small"
                  >
                    Load
                  </Button>,
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteSearch(query.id)}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={query.name}
                  description={
                    <>
                      {query.query.full_text && (
                        <Tag>Full-text: {query.query.full_text}</Tag>
                      )}
                      {query.query.sale_id && (
                        <Tag>ID: {query.query.sale_id}</Tag>
                      )}
                      {query.query.customer_name && (
                        <Tag>Customer: {query.query.customer_name}</Tag>
                      )}
                      {query.query.product_name && (
                        <Tag>Product: {query.query.product_name}</Tag>
                      )}
                      {query.query.notes && (
                        <Tag>Notes: {query.query.notes}</Tag>
                      )}
                      <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                        Created: {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                    </>
                  }
                />
              </List.Item>
            )}
            locale={{
              emptyText: <Empty description="No saved searches" />,
            }}
          />
        </>
      )}
    </Modal>
  );
};