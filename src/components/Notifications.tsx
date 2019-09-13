import {
  Box,
  Column,
  Container,
  Heading,
  Icon,
  Row,
  Text,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { withRouter } from 'react-router';

import { useNotificationsQuery } from '../oracle/useNotificationsQuery';
import { Background } from './Background';

export const Notifications = withRouter(props => {
  const { history } = props;
  const {
    data: notifications,
    loading: notificationsLoading,
  } = useNotificationsQuery();
  const theme = useTheme();

  if (notificationsLoading) return <Text>Loading...</Text>;

  return (
    <Box>
      <Box paddingTop={40} paddingLeft={16} alignItems="flex-start">
        <TouchableOpacity onPress={() => history.replace('/my-account')}>
          <View style={{ width: 40, height: 40 }}>
            <Icon
              size={24}
              name="arrow-left"
              color={theme.colors.text.primary}
            />
          </View>
        </TouchableOpacity>
      </Box>
      <Box paddingBottom={16} paddingHorizontal={60}>
        <Heading align="center" color="primary" size="xxlarge">
          NOTIFICATIONS
        </Heading>
      </Box>
      <Background pattern="dotted">
        <Box paddingHorizontal={60}>
          <Container>
            <Row>
              {notifications.map((notification, index) => (
                <Column key={index}>
                  <Box paddingBottom={24}>{notification}</Box>
                </Column>
              ))}
            </Row>
          </Container>
        </Box>
      </Background>
    </Box>
  );
});
