import styled from '@emotion/styled';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../components/templates/PageContainer';
import TwoColumnLayout from '../components/templates/TwoColumnLayout';
import FilterPanel from '../components/organisms/marketplace/FilterPanel';
import SearchResults from '../components/organisms/marketplace/SearchResults';
import SearchBar from '../components/molecules/marketplace/SearchBar';
import SortSelector from '../components/molecules/marketplace/SortSelector';

const SearchHeader = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const SearchSection = styled.div`
  flex: 1;
`;

const SortSection = styled.div`
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ResultsInfo = styled.div`
  padding: 16px;
  font-size: 15px;
  color: #65676b;

  strong {
    color: #050505;
  }
`;

/**
 * SearchPage Component
 * Search results page with filters and sorting
 * Uses URL search parameters to maintain search state
 */
const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <PageContainer>
      <SearchHeader>
        <SearchSection>
          <SearchBar defaultValue={query} />
        </SearchSection>
        <SortSection>
          <SortSelector />
        </SortSection>
      </SearchHeader>

      {query && (
        <ResultsInfo>
          Search results for <strong>"{query}"</strong>
        </ResultsInfo>
      )}

      <TwoColumnLayout
        sidebar={<FilterPanel />}
        main={<SearchResults searchQuery={query} />}
      />
    </PageContainer>
  );
};

export default SearchPage;