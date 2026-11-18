import { SearchFilters, SearchFiltersProps } from "./SearchFilters";

type Props = Omit<SearchFiltersProps<string>, "tipoPesquisa" | "setTipoPesquisa">;

export function MaterialsFilters(props: Props) {
  return (
    <SearchFilters
      {...props}
      testID="materials-filters"
      fieldLabel="ID ou nome"
      placeholder="Digite o ID ou o nome do produto..."
    />
  );
}
