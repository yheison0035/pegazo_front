import { formatDateDMY } from '@/lib/api/utils/utils';
import { useState, useMemo } from 'react';

export default function useTableFilters(info = [], view) {
  const [filters, setFilters] = useState({
    role: '',
    name: '',
    email: '',
    phone: '',
    userId: '',
    status: '',
    deliveryDate: '',
    description: '',
    managerId: '',
    city: '',
    address: '',
    contactName: '',
    productType: '',
    stock: '',
    managedLocals: '',
    providerId: '',
    salePrice: '',
    document: '',
    type_document: '',
    customer: '',
    code: '',
    totalAmount: '',
    paymentMethod: '',
    paymentStatus: '',
    saleDate: '',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filtered = useMemo(() => {
    const arrayInfo = Array.isArray(info) ? info : [];

    return arrayInfo.filter((a) => {
      const roleMatch = filters.role
        ? a.role?.toLowerCase().includes(filters.role.toLowerCase())
        : true;

      const nameMatch = filters.name
        ? a.name?.toLowerCase().includes(filters.name.toLowerCase())
        : true;

      const emailMatch = filters.email
        ? a.email?.toLowerCase().includes(filters.email.toLowerCase())
        : true;

      const phoneMatch = filters.phone
        ? a.phone?.toLowerCase().includes(filters.phone.toLowerCase())
        : true;

      const userNameMatchMatch = filters.userId
        ? a.user?.name?.toLowerCase().includes(filters.userId.toLowerCase())
        : true;

      const descriptionMatch = filters.description
        ? a.description
            ?.toLowerCase()
            .includes(filters.description.toLowerCase())
        : true;

      const statusMatch = filters.status
        ? (a.status?.toLowerCase() || '').includes(filters.status.toLowerCase())
        : true;

      const userNameMatch = filters.managerId
        ? (a.manager?.name?.toLowerCase() || '').includes(
            filters.managerId.toLowerCase()
          )
        : true;

      const cityMatch = filters.city
        ? (a.city?.toLowerCase() || '').includes(filters.city.toLowerCase())
        : true;

      const addressMatch = filters.address
        ? (a.address?.toLowerCase() || '').includes(
            filters.address.toLowerCase()
          )
        : true;

      const contactNameMatch = filters.contactName
        ? (a.contactName?.toLowerCase() || '').includes(
            filters.contactName.toLowerCase()
          )
        : true;

      const productTypeMatch = filters.productType
        ? (a.productType?.toLowerCase() || '').includes(
            filters.productType.toLowerCase()
          )
        : true;

      const stockMatch = filters.stock
        ? String(a.stock).includes(String(filters.stock))
        : true;

      const localMatch = filters.managedLocals
        ? a.managedLocals?.some((local) =>
            local.name
              ?.toLowerCase()
              .includes(filters.managedLocals.toLowerCase())
          ) ||
          a.local?.name
            ?.toLowerCase()
            .includes(filters.managedLocals.toLowerCase())
        : true;

      const providerMatch = filters.providerId
        ? (a.provider?.name?.toLowerCase() || '').includes(
            filters.providerId.toLowerCase()
          )
        : true;

      const salePriceMatch = filters.salePrice
        ? String(a.salePrice).includes(String(filters.salePrice))
        : true;

      const documentMatch = filters.document
        ? String(a.document).includes(String(filters.document))
        : true;

      const typeDocumentMatch = filters.type_document
        ? String(a.type_document).includes(String(filters.type_document))
        : true;

      const codeSaleMatch = filters.code
        ? (a.code?.toLowerCase() || '').includes(filters.code.toLowerCase())
        : true;

      const customerMatch = filters.customer
        ? (a.customer?.name?.toLowerCase() || '').includes(
            filters.customer.toLowerCase()
          )
        : true;

      const totalAmountMatch = filters.totalAmount
        ? String(a.totalAmount).includes(String(filters.totalAmount))
        : true;

      const paymentMethodMatch = filters.paymentMethod
        ? (a.paymentMethod?.toLowerCase() || '').includes(
            filters.paymentMethod.toLowerCase()
          )
        : true;

      const paymentStatusMatch = filters.paymentStatus
        ? (a.paymentStatus?.toLowerCase() || '').includes(
            filters.paymentStatus.toLowerCase()
          )
        : true;

      const saleDateMatch = filters.saleDate
        ? String(formatDateDMY(a.saleDate) || '').includes(filters.saleDate)
        : true;

      return (
        roleMatch &&
        nameMatch &&
        emailMatch &&
        phoneMatch &&
        userNameMatchMatch &&
        descriptionMatch &&
        statusMatch &&
        userNameMatch &&
        cityMatch &&
        addressMatch &&
        productTypeMatch &&
        contactNameMatch &&
        stockMatch &&
        localMatch &&
        providerMatch &&
        salePriceMatch &&
        documentMatch &&
        typeDocumentMatch &&
        codeSaleMatch &&
        customerMatch &&
        totalAmountMatch &&
        paymentMethodMatch &&
        paymentStatusMatch &&
        saleDateMatch
      );
    });
  }, [info, filters, view]);

  return {
    filters,
    setFilters,
    filtered,
    handleFilterChange,
  };
}
