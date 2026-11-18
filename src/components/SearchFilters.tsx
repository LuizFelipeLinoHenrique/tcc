import { ReactNode } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { FilterChoices, FilterPanel, filterStyles } from "./FilterPanel";
import { pagesStyles } from "./ScreensLayout";

export type SearchFiltersProps<T extends string> = {
  pesquisa: string;
  setPesquisa: (value: string) => void;
  tipoPesquisa: T;
  setTipoPesquisa: (value: T) => void;
  onSearch: () => void;
  onClear: () => void;
  isMobile: boolean;
};

type Props<T extends string> = Omit<SearchFiltersProps<T>, "tipoPesquisa" | "setTipoPesquisa"> & (
  | (Pick<SearchFiltersProps<T>, "tipoPesquisa" | "setTipoPesquisa"> & {
      options: readonly (readonly [T, string])[];
    })
  | { options?: undefined }
) & {
  placeholder: string;
  fieldLabel?: string;
  keyboardType?: TextInputProps["keyboardType"];
  additionalFilters?: ReactNode;
  additionalFiltersLabel?: string;
  testID?: string;
};

export function SearchFilters<T extends string>(p: Props<T>) {
  const { placeholder, fieldLabel = "Pesquisa", keyboardType = "default" } = p;
  return <FilterPanel onClear={p.onClear} isMobile={p.isMobile} additionalFilters={p.additionalFilters} additionalFiltersLabel={p.additionalFiltersLabel} testID={p.testID}>
    <View style={[filterStyles.searchRow, p.isMobile && filterStyles.column]}>
      {p.options && <View style={filterStyles.searchType}>
        <Text style={pagesStyles.label}>Pesquisar por</Text>
        <FilterChoices items={p.options} value={p.tipoPesquisa} onChange={p.setTipoPesquisa} />
      </View>}
      <View style={filterStyles.searchField}>
        <Text style={pagesStyles.label}>{fieldLabel}</Text>
        <View style={filterStyles.inputRow}>
          <TextInput accessibilityLabel={fieldLabel} placeholder={placeholder} keyboardType={keyboardType} value={p.pesquisa} onChangeText={p.setPesquisa} onSubmitEditing={p.onSearch} style={[pagesStyles.input, filterStyles.input]} />
          <Pressable accessibilityRole="button" onPress={p.onSearch} style={pagesStyles.primaryButton}><Text style={pagesStyles.primaryButtonText}>Pesquisar</Text></Pressable>
        </View>
      </View>
    </View>
  </FilterPanel>;
}
