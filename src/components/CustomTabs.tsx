import { Box, Divider, Heading, useTheme } from 'paramount-ui';
import React from 'react';
import { TouchableOpacity } from 'react-native';

interface TabProps {
  label: string;
  value: string;
  onPress: (value: string) => void;
  isActive: boolean;
}

const Tab = (props: TabProps) => {
  const { label, value, onPress, isActive } = props;
  const theme = useTheme();

  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={() => onPress(value)}>
      <Box paddingBottom={16}>
        <Heading
          align="center"
          size="xxlarge"
          color={isActive ? 'primary' : 'muted'}
        >
          {label}
        </Heading>
      </Box>
      {isActive ? (
        <Divider
          color={theme.colors.text.primary}
          getStyles={() => ({ dividerStyle: { height: 6 } })}
        />
      ) : (
        <Box height={6} />
      )}
      <Divider />
    </TouchableOpacity>
  );
};

export interface Tab {
  label: string;
  value: string;
}

export interface TabsProps {
  onChangeTab: (value: string) => void;
  tabs: Tab[];
  currentValue: string;
}

export const Tabs = (props: TabsProps) => {
  const { onChangeTab, tabs, currentValue } = props;

  return (
    <Box flexDirection="row">
      {tabs.map(tab => (
        <Tab
          key={tab.value}
          label={tab.label}
          isActive={tab.value === currentValue}
          value={tab.value}
          onPress={onChangeTab}
        />
      ))}
    </Box>
  );
};
