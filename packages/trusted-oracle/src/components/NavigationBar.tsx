import {
  Box,
  Container,
  Divider,
  Heading,
  Icon,
  Modal,
  Text,
  Visible,
} from 'paramount-ui';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { FamilyOfProducts } from './FamilyOfProducts';
import { Link, LinkProps } from './Link';
import { Logo } from './Logo';

// import { BlockchainAccountStatus } from './BlockchainAccountStatus';
const DesktopNavigationBarDivider = () => (
  <Divider
    position="vertical"
    getStyles={() => ({
      dividerStyle: {
        height: 30,
      },
    })}
  />
);

const DesktopNavigationBarLink = (props: LinkProps) => {
  const { children, to, isExternal } = props;

  return (
    <Link
      to={to}
      isExternal={isExternal}
      style={{ textDecoration: 'none', height: '100%' }}
    >
      <Box justifyContent="center" height="100%" paddingHorizontal={16}>
        <Text color="primary">{children}</Text>
      </Box>
    </Link>
  );
};

const DesktopNavigationBar = () => {
  return (
    <>
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        backgroundColor="#222222"
        flexWrap="wrap"
        height={55}
      >
        <FamilyOfProducts />
      </Box>
      <Box
        flexDirection="row"
        height={80}
        justifyContent="space-between"
        paddingHorizontal={31}
        zIndex={1}
      >
        <Logo />
        <Box flexDirection="row" alignItems="center">
          <DesktopNavigationBarLink to="/">Home</DesktopNavigationBarLink>
          <DesktopNavigationBarDivider />
          <DesktopNavigationBarLink to="/explore">
            Explore
          </DesktopNavigationBarLink>
          <DesktopNavigationBarDivider />
          <DesktopNavigationBarLink to="/campaign/new/basic-info">
            Create Campaign
          </DesktopNavigationBarLink>
          <DesktopNavigationBarDivider />
          <DesktopNavigationBarLink
            to="https://blog.wetrust.io/cryptounlocked-oracle-upgrade-5c8b22e3375b"
            isExternal
          >
            How it works
          </DesktopNavigationBarLink>
          <Box paddingLeft={16}>{/* <BlockchainAccountStatus /> */}</Box>
        </Box>
      </Box>
      <Divider />
    </>
  );
};

const MobileNavigationMenuLink = (props: LinkProps) => {
  const { children, to, onClick, isExternal } = props;

  return (
    <Link to={to} onClick={onClick} isExternal={isExternal}>
      <Box alignItems="center" paddingVertical={16}>
        <Heading size="xxlarge" color="link">
          {children}
        </Heading>
      </Box>
      <Divider />
    </Link>
  );
};

interface MobileNavigationMenuProps {
  onClick?: () => void;
}

const MobileNavigationMenu = (props: MobileNavigationMenuProps) => {
  const { onClick } = props;

  return (
    <>
      <MobileNavigationMenuLink onClick={onClick} to="/">
        Home
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink onClick={onClick} to="/explore">
        Explore
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink onClick={onClick} to="/my-contributions">
        My Contributions
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink
        onClick={onClick}
        to="/campaign/new/basic-info"
        isExternal
      >
        Create Campaign
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink onClick={onClick} to="/campaign/my-campaigns">
        My Campaigns
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink
        onClick={onClick}
        to="https://blog.wetrust.io/cryptounlocked-oracle-upgrade-5c8b22e3375b"
        isExternal
      >
        How it works
      </MobileNavigationMenuLink>
    </>
  );
};

const MobileNavigationBar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <Container fluid>
        <Box
          flexDirection="row"
          height={60}
          justifyContent="space-between"
          zIndex={1}
        >
          <Logo />
          <Box flexDirection="row" alignItems="center">
            {/* <BlockchainAccountStatus /> */}
            <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
              <View style={{ padding: 16 }}>
                <Icon name="menu" size={24} />
              </View>
            </TouchableOpacity>
          </Box>
        </Box>
        <Modal visible={isMenuOpen} onRequestClose={() => setIsMenuOpen(false)}>
          <Box flexDirection="row" height={60} justifyContent="flex-end">
            <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
              <View style={{ padding: 16 }}>
                <Icon name="x" size={32} />
              </View>
            </TouchableOpacity>
          </Box>
          <Box paddingBottom={100}>
            <MobileNavigationMenu onClick={() => setIsMenuOpen(false)} />
          </Box>
          <Box paddingTop={48} backgroundColor="#222222" height="100%">
            <Box flexWrap="wrap" flexDirection="row" justifyContent="center">
              <FamilyOfProducts />
            </Box>
          </Box>
        </Modal>
      </Container>
      <Divider />
    </>
  );
};

export const NavigationBar = () => {
  return (
    <>
      <Visible xsmall small medium>
        <MobileNavigationBar />
      </Visible>
      <Visible large xlarge>
        <DesktopNavigationBar />
      </Visible>
    </>
  );
};
