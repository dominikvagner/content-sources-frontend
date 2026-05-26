import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { usePackageModalOutletContext } from '../PackageModal/PackageModal';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useBulkRemoveRepositoryRpmsMutate } from 'services/Content/ContentQueries';

import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { PackagesTableBasic } from 'components/Tables/Packages/PackagesTableBasic';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';

const PackagesDeleteModal = () => {
  const queryClient = useQueryClient();
  const onClose = useNavigateTo('packagesLatest');
  const navigateToRepos = useNavigateTo('repositories');
  const repoUUID = useSafeUUIDParam('repoUUID');

  const {
    clearSelectedPackages,
    deletionContext: { selectedPackages },
  } = usePackageModalOutletContext();

  const { mutateAsync: removeRpms, isPending } = useBulkRemoveRepositoryRpmsMutate(
    queryClient,
    repoUUID,
  );

  useEffect(() => {
    if (!selectedPackages.length) {
      onClose();
    }
  }, [selectedPackages, onClose]);

  const onConfirm = async () => {
    const uuids = selectedPackages.map((p) => p.uuid);
    await removeRpms(uuids);
    clearSelectedPackages();
    navigateToRepos();
  };

  return (
    <Modal
      onClose={onClose}
      position='top'
      variant={ModalVariant.large}
      ouiaId='delete_packages'
      aria-labelledby='delete-packages-modal'
      isOpen
    >
      <ModalHeader
        title='Delete packages?'
        labelId='delete-packages-modal'
        titleIconVariant='warning'
      />
      <ModalBody>
        <Content component='p'>
          {selectedPackages.length === 1
            ? 'Are you sure you want to delete this package? A new snapshot will be created without this package.'
            : `Are you sure you want to delete these ${selectedPackages.length} packages? A new snapshot will be created without these packages.`}
        </Content>
        <PackagesTableBasic items={selectedPackages} />
      </ModalBody>
      <ModalFooter>
        <Button
          key='confirm'
          ouiaId='delete_packages_confirm'
          variant='danger'
          isLoading={isPending}
          isDisabled={isPending || !selectedPackages.length}
          onClick={onConfirm}
        >
          Delete
        </Button>
        <Button key='cancel' variant='link' onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PackagesDeleteModal;
