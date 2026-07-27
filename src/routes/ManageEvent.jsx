import GuestsTab from "@/components/manage-event/GuestsTab";
import OverviewTab from "@/components/manage-event/OverviewTab";
import PayoutsTab from "@/components/manage-event/PayoutsTab";
import { useManageEventContext } from "@/layouts/ManageEventLayout";
import { useEffect } from "react";
import { useLocation } from "react-router";

function ManageEvent() {
  const location = useLocation();
  const { tab, event } = useManageEventContext();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [location]);

  const hasChipIn = event?.chipInDetails ?? false;

  const renderTabContent = () => {
    switch (tab) {
      case "overview":
        return <OverviewTab />;
      case "guests":
        return <GuestsTab isPaidEvent={hasChipIn ? true : false} />;
      case "payouts":
        return <PayoutsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <main className="bg-[#F0F0F0] h-full relative flex-1 flex flex-col pt-6 w-full pb-10">
      <div className="max-w-[930px] w-full mx-auto flex">
        {renderTabContent()}
      </div>
    </main>
  );
}

export default ManageEvent;
